import { useEffect, useState } from 'react';
import { FileText, Plus, Upload, Download, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminCenterSidebar from '../../components/AdminCenterSidebar';
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
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<CompanyResource | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Policies');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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
      const data = await listResources(filterCategory || undefined);
      setResources(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchResources();
  }, [filterCategory]);

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

  async function handleDelete(id: number) {
    try {
      await deleteResource(id);
      setDeleteConfirm(null);
      fetchResources();
    } catch { /* ignore */ }
  }

  return (
    <div className="admin-center-layout">
      <AdminCenterSidebar activeMenu="companyResources" onNavigate={onNavigate} />
      <div className="admin-center-content">
        <div className="admin-center-header">
          <div>
            <h1>Company Resources</h1>
            <p className="admin-center-description">
              Upload and manage company policies and employee handbook documents.
            </p>
          </div>
          <button className="admin-add-btn" onClick={openAddModal}>
            <Plus size={16} />
            Upload Resource
          </button>
        </div>

        <div className="resource-filter-bar">
          <button
            className={`resource-filter-btn ${filterCategory === '' ? 'active' : ''}`}
            onClick={() => setFilterCategory('')}
          >
            All
          </button>
          <button
            className={`resource-filter-btn ${filterCategory === 'Policies' ? 'active' : ''}`}
            onClick={() => setFilterCategory('Policies')}
          >
            Policies
          </button>
          <button
            className={`resource-filter-btn ${filterCategory === 'Employee Handbook' ? 'active' : ''}`}
            onClick={() => setFilterCategory('Employee Handbook')}
          >
            Employee Handbook
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="admin-empty-state">
            <Upload size={48} strokeWidth={1} />
            <h3>No resources found</h3>
            <p>Upload your first company resource to get started.</p>
          </div>
        ) : (
          <div className="resource-table-wrap">
            <table className="resource-table">
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
                {resources.map((r) => (
                  <tr key={r.id} className={!r.is_active ? 'resource-row-inactive' : ''}>
                    <td className="resource-title-cell">
                      <FileText size={16} />
                      <span>{r.title}</span>
                    </td>
                    <td>
                      <span className={`resource-category-badge ${r.category === 'Policies' ? 'cat-policies' : 'cat-handbook'}`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="resource-filename">{r.file_name}</td>
                    <td>{formatFileSize(r.file_size)}</td>
                    <td>{r.uploaded_by || '-'}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <button
                        className={`resource-toggle-btn ${r.is_active ? 'active' : ''}`}
                        onClick={() => handleToggleActive(r)}
                        title={r.is_active ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                      >
                        {r.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        <span>{r.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td>
                      <div className="resource-actions">
                        <button className="resource-action-btn" title="Download" onClick={() => downloadResource(r.id)}>
                          <Download size={15} />
                        </button>
                        <button className="resource-action-btn" title="Edit" onClick={() => openEditModal(r)}>
                          <Pencil size={15} />
                        </button>
                        {deleteConfirm === r.id ? (
                          <div className="resource-delete-confirm">
                            <button className="resource-delete-yes" onClick={() => handleDelete(r.id)}>Delete</button>
                            <button className="resource-delete-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="resource-action-btn delete" title="Delete" onClick={() => setDeleteConfirm(r.id)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal resource-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{editingResource ? 'Edit Resource' : 'Upload Resource'}</h2>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="Enter resource title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select
                    className="admin-form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Policies">Policies</option>
                    <option value="Employee Handbook">Employee Handbook</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>{editingResource ? 'Replace File (optional)' : 'File'}</label>
                  <div className="resource-file-input-wrap">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                      onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {editingResource && !formFile && (
                    <div className="resource-current-file">Current file: {editingResource.file_name}</div>
                  )}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="admin-modal-save"
                  onClick={handleSubmit}
                  disabled={submitting || !formTitle.trim() || (!editingResource && !formFile)}
                >
                  {submitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCompanyResourcesPage;
