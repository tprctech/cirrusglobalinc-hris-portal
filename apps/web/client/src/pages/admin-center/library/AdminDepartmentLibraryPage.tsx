import { PenSquare, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import { useAuth } from '../../../app/AuthContext';
import '../AdminCenterPage.css';

type AdminDepartmentLibraryPageProps = {
  onNavigate?: (path: string) => void;
};

const PAGE_SIZE = 8;

interface DepartmentRecord {
  id: number;
  name: string;
  description: string;
  created_by: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

type DepartmentDraft = {
  name: string;
  description: string;
  status: string;
};

function emptyDraft(): DepartmentDraft {
  return { name: '', description: '', status: 'Active' };
}

const API_BASE = '/api/v1/hr/departments';

function AdminDepartmentLibraryPage({ onNavigate }: AdminDepartmentLibraryPageProps) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draft, setDraft] = useState<DepartmentDraft>(emptyDraft());
  const [draftError, setDraftError] = useState('');
  const [editingDept, setEditingDept] = useState<DepartmentRecord | null>(null);
  const [editDraft, setEditDraft] = useState<DepartmentDraft>(emptyDraft());
  const [editError, setEditError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<DepartmentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      const res = await fetch(API_BASE + '/');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDepartment() {
    setDraftError('');
    if (!draft.name.trim()) {
      setDraftError('Department name is required.');
      return;
    }
    try {
      const res = await fetch(API_BASE + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          description: draft.description.trim(),
          created_by: user?.employee?.displayName || user?.email || 'Admin',
          status: draft.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to create' }));
        setDraftError(data.detail || 'Failed to create department');
        return;
      }
      setDraft(emptyDraft());
      setShowAddModal(false);
      setCurrentPage(1);
      await loadDepartments();
    } catch {
      setDraftError('Network error');
    }
  }

  function openEditModal(dept: DepartmentRecord) {
    setEditingDept(dept);
    setEditDraft({ name: dept.name, description: dept.description, status: dept.status });
    setEditError('');
  }

  async function handleUpdateDepartment() {
    if (!editingDept) return;
    setEditError('');
    if (!editDraft.name.trim()) {
      setEditError('Department name is required.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          description: editDraft.description.trim(),
          status: editDraft.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to update' }));
        setEditError(data.detail || 'Failed to update department');
        return;
      }
      setEditingDept(null);
      await loadDepartments();
    } catch {
      setEditError('Network error');
    }
  }

  const [deleteError, setDeleteError] = useState('');

  async function handleDeleteDepartment(id: number) {
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to delete department.' }));
        setDeleteError(data.detail || 'Failed to delete department.');
        return;
      }
      await loadDepartments();
    } catch {
      setDeleteError('Failed to delete department.');
    }
  }

  const filtered = useMemo(() => {
    let result = departments;
    if (statusFilter !== 'All') {
      result = result.filter((d) => d.status === statusFilter);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.created_by.toLowerCase().includes(q),
      );
    }
    return result;
  }, [departments, searchTerm, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="libraryDepartment" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Department Library</h1>
                <p>Manage departments used across the organization.</p>
              </div>
              <div className="admin-toolbar-actions">
                <button
                  className="admin-invite-btn"
                  onClick={() => {
                    setDraft(emptyDraft());
                    setDraftError('');
                    setShowAddModal(true);
                  }}
                >
                  <Plus size={16} />
                  Add Department
                </button>
              </div>
            </div>

            <div className="admin-filters-bar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {loading ? (
              <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>Loading departments...</div>
            ) : (
              <>
                {deleteError && (
                  <div className="admin-delete-error" style={{ background: '#fff1f2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
                    {deleteError}
                    <button onClick={() => setDeleteError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 600 }}>×</button>
                  </div>
                )}
                <div className="admin-users-table-wrap">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Department Description</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalItems === 0 && (
                        <tr>
                          <td colSpan={5} className="admin-empty-state">No departments found.</td>
                        </tr>
                      )}
                      {paged.map((dept) => (
                        <tr key={dept.id}>
                          <td>{dept.name}</td>
                          <td>{dept.description}</td>
                          <td>{dept.created_by}</td>
                          <td>
                            <span className={`admin-status-badge ${dept.status === 'Active' ? 'active' : 'inactive'}`}>
                              {dept.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions-cell">
                              <button className="admin-icon-action-btn" title="Edit" onClick={() => openEditModal(dept)}>
                                <PenSquare size={14} />
                              </button>
                              <button className="admin-icon-action-btn danger" title="Delete" onClick={() => setPendingDelete(dept)}>
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

      {showAddModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Add Department</h3>
                <p>Create a new department for the organization.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="admin-edit-grid single-column">
              {draftError && <div className="admin-form-error">{draftError}</div>}
              <div className="admin-form-field">
                <label htmlFor="add-dept-name">Department Name</label>
                <input
                  id="add-dept-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-dept-description">Description</label>
                <textarea
                  id="add-dept-description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Describe the department"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-dept-status">Status</label>
                <select
                  id="add-dept-status"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleAddDepartment}>Add Department</button>
            </div>
          </div>
        </div>
      )}

      {editingDept && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Edit Department</h3>
                <p>Update department details.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setEditingDept(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="admin-edit-grid single-column">
              {editError && <div className="admin-form-error">{editError}</div>}
              <div className="admin-form-field">
                <label htmlFor="edit-dept-name">Department Name</label>
                <input
                  id="edit-dept-name"
                  type="text"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-dept-description">Description</label>
                <textarea
                  id="edit-dept-description"
                  rows={3}
                  value={editDraft.description}
                  onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-dept-status">Status</label>
                <select
                  id="edit-dept-status"
                  value={editDraft.status}
                  onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingDept(null)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleUpdateDepartment}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete Department"
        message={`Are you sure you want to delete "${pendingDelete?.name ?? ''}"? Roles linked to this department will become unassigned.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) handleDeleteDepartment(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}

export default AdminDepartmentLibraryPage;
