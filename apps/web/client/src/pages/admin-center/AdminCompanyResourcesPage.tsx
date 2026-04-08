import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Upload, X } from 'lucide-react';
import AdminCenterSidebar from '../../components/AdminCenterSidebar';
import AdminTablePagination from '../../components/AdminTablePagination';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  type CompanyResource,
} from '../../api/companyResources';
import './AdminCenterPage.css';

type AdminCompanyResourcesPageProps = {
  onNavigate: (path: string) => void;
};

const PAGE_SIZE = 8;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function AdminCompanyResourcesPage({ onNavigate }: AdminCompanyResourcesPageProps) {
  const [resources, setResources] = useState<CompanyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<CompanyResource | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Policies');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CompanyResource | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.email || '';
      }
    } catch { /* ignore */ }
    return '';
  })();

  async function fetchResources() {
    setLoading(true);
    try {
      const data = await listResources();
      setResources(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchResources();
  }, []);

  const filtered = useMemo(() => {
    let result = resources;
    if (categoryFilter !== 'All') {
      result = result.filter((r) => r.category === categoryFilter);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.file_name.toLowerCase().includes(q) ||
          (r.uploaded_by || '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [resources, searchTerm, categoryFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  function openAddModal() {
    setEditingResource(null);
    setFormTitle('');
    setFormCategory('Policies');
    setFormFile(null);
    setShowModal(true);
  }

  function openEditModal(r: CompanyResource) {
    setEditingResource(r);
    setFormTitle(r.title);
    setFormCategory(r.category);
    setFormFile(null);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formTitle.trim()) return;
    setSubmitting(true);
    try {
      if (editingResource) {
        await updateResource(editingResource.id, {
          title: formTitle.trim(),
          category: formCategory,
          uploaded_by: currentUser,
          file: formFile || undefined,
        });
      } else {
        if (!formFile) return;
        await createResource({
          title: formTitle.trim(),
          category: formCategory,
          uploaded_by: currentUser,
          file: formFile,
        });
      }
      setShowModal(false);
      fetchResources();
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleToggleActive(r: CompanyResource) {
    try {
      await updateResource(r.id, { is_active: !r.is_active });
      fetchResources();
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteResource(pendingDelete.id);
      setPendingDelete(null);
      fetchResources();
    } catch { /* ignore */ }
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="companyResources" onNavigate={onNavigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Company Resources</h1>
                <p>Upload and manage company policies and employee handbook documents.</p>
              </div>
              <div className="admin-toolbar-actions">
                <button className="admin-invite-btn" onClick={openAddModal}>
                  <Plus size={16} />
                  Upload Resource
                </button>
              </div>
            </div>

            <div className="admin-filters-bar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">All Categories</option>
                <option value="Policies">Policies</option>
                <option value="Employee Handbook">Employee Handbook</option>
              </select>
            </div>

            {loading ? (
              <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>Loading resources...</div>
            ) : (
              <>
                <div className="admin-users-table-wrap">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>File</th>
                        <th>Size</th>
                        <th>Uploaded By</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalItems === 0 && (
                        <tr>
                          <td colSpan={8} className="admin-empty-state">
                            <Upload size={48} strokeWidth={1} />
                            <h3>No resources found</h3>
                            <p>Upload your first company resource to get started.</p>
                          </td>
                        </tr>
                      )}
                      {paged.map((r) => (
                        <tr key={r.id} style={!r.is_active ? { opacity: 0.55 } : undefined}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <span>{r.title}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-status-badge ${r.category === 'Policies' ? 'active' : 'inactive'}`}>
                              {r.category}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.file_name}</td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{formatFileSize(r.file_size)}</td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{r.uploaded_by || '-'}</td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{formatDate(r.created_at)}</td>
                          <td>
                            <button
                              className="admin-icon-btn"
                              onClick={() => handleToggleActive(r)}
                              title={r.is_active ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                                color: r.is_active ? 'var(--primary)' : 'var(--gray-400)',
                              }}
                            >
                              {r.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                              <span>{r.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>
                          <td>
                            <div className="admin-actions-cell">
                              <button className="admin-icon-action-btn" title="Download" onClick={() => downloadResource(r.id)}>
                                <Download size={14} />
                              </button>
                              <button className="admin-icon-action-btn" title="Edit" onClick={() => openEditModal(r)}>
                                <Pencil size={14} />
                              </button>
                              <button className="admin-icon-action-btn danger" title="Delete" onClick={() => setPendingDelete(r)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AdminTablePagination
                  currentPage={safeCurrentPage}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </section>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete Resource"
        message={`Are you sure you want to delete "${pendingDelete?.title ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      {showModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>{editingResource ? 'Edit Resource' : 'Upload Resource'}</h3>
                <p>{editingResource ? 'Update resource details.' : 'Upload a new company resource.'}</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="admin-edit-grid single-column">
              <div className="admin-form-field">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Enter resource title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label>Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="Policies">Policies</option>
                  <option value="Employee Handbook">Employee Handbook</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label>{editingResource ? 'Replace File (optional)' : 'File'}</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                />
                {editingResource && !formFile && (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Current file: {editingResource.file_name}</span>
                )}
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="admin-primary-btn"
                onClick={handleSubmit}
                disabled={submitting || !formTitle.trim() || (!editingResource && !formFile)}
              >
                {submitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminCompanyResourcesPage;
