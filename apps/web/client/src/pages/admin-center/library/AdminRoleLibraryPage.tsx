import { Copy, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import { useAuth } from '../../../app/AuthContext';
import '../AdminCenterPage.css';

type AdminRoleLibraryPageProps = {
  onNavigate?: (path: string) => void;
};

const PAGE_SIZE = 8;
const ROLES_API = '/api/v1/hr/roles';
const DEPARTMENTS_API = '/api/v1/hr/departments';
const COMPETENCIES_API = '/api/v1/hr/competencies';

interface RoleRecord {
  id: number;
  role_job_title: string;
  role_description: string;
  users_in_role: number;
  department_id: number | null;
  department_name: string;
  required_competencies: string;
  created_by: string;
  status: string;
}

interface DeptRecord {
  id: number;
  name: string;
}

interface CompRecord {
  id: number;
  competency_name: string;
}

type RoleDraft = {
  roleJobTitle: string;
  roleDescription: string;
  departmentId: number | null;
  competencyIds: number[];
  status: string;
};

function emptyDraft(): RoleDraft {
  return { roleJobTitle: '', roleDescription: '', departmentId: null, competencyIds: [], status: 'Active' };
}

function AdminRoleLibraryPage({ onNavigate }: AdminRoleLibraryPageProps) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [departments, setDepartments] = useState<DeptRecord[]>([]);
  const [competencies, setCompetencies] = useState<CompRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<RoleDraft>(emptyDraft());
  const [competencySearchTerm, setCompetencySearchTerm] = useState('');
  const [roleTitleError, setRoleTitleError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [competencyError, setCompetencyError] = useState('');
  const [pendingDeleteRole, setPendingDeleteRole] = useState<RoleRecord | null>(null);
  const [pendingDeleteRequiredCompetency, setPendingDeleteRequiredCompetency] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [rolesRes, deptsRes, compsRes] = await Promise.all([
        fetch(ROLES_API + '/'),
        fetch(DEPARTMENTS_API + '/'),
        fetch(COMPETENCIES_API + '/'),
      ]);
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (compsRes.ok) setCompetencies(await compsRes.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const competencyOptions = useMemo(() => {
    return competencies
      .filter((c) => c.competency_name?.trim())
      .sort((a, b) => a.competency_name.localeCompare(b.competency_name));
  }, [competencies]);

  const filteredCompetencyOptions = useMemo(() => {
    const query = competencySearchTerm.trim().toLowerCase();
    return competencyOptions.filter((c) => {
      if (newRole.competencyIds.includes(c.id)) return false;
      if (!query) return true;
      return c.competency_name.toLowerCase().includes(query);
    });
  }, [competencyOptions, competencySearchTerm, newRole.competencyIds]);

  const selectedCompetencyNames = useMemo(() => {
    const map = new Map(competencies.map((c) => [c.id, c.competency_name]));
    return newRole.competencyIds.map((id) => ({ id, name: map.get(id) || `#${id}` }));
  }, [newRole.competencyIds, competencies]);

  function handleAddRole() {
    setRoleTitleError('');
    setDepartmentError('');
    setCompetencyError('');
    setSubmitError('');
    setCompetencySearchTerm('');
    setNewRole(emptyDraft());
    setShowAddRoleModal(true);
  }

  async function handleCopyRole(role: RoleRecord) {
    try {
      const detailRes = await fetch(`${ROLES_API}/${role.id}`);
      const detail = detailRes.ok ? await detailRes.json() : null;

      const compNames = (role.required_competencies || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const compIds = competencies
        .filter((c) => compNames.includes(c.competency_name))
        .map((c) => c.id);

      const res = await fetch(ROLES_API + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_job_title: `${role.role_job_title} (Copy)`,
          role_description: role.role_description,
          department_id: role.department_id,
          created_by: user?.employee?.displayName || user?.email || 'Admin',
          status: role.status || 'Active',
          competency_ids: compIds.length > 0 ? compIds : (detail?.competency_ids ?? []),
        }),
      });
      if (res.ok) await loadAll();
    } catch {
    }
  }

  async function handleDeleteRole(id: number) {
    try {
      await fetch(`${ROLES_API}/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch {
    }
  }

  function addRequiredCompetency(comp: CompRecord) {
    setNewRole((prev) => {
      if (prev.competencyIds.includes(comp.id)) return prev;
      return { ...prev, competencyIds: [...prev.competencyIds, comp.id] };
    });
    setCompetencySearchTerm('');
    setCompetencyError('');
  }

  function removeRequiredCompetency(id: number) {
    setNewRole((prev) => ({
      ...prev,
      competencyIds: prev.competencyIds.filter((cid) => cid !== id),
    }));
  }

  async function handleSubmitNewRole() {
    setRoleTitleError('');
    setDepartmentError('');
    setCompetencyError('');
    setSubmitError('');

    let hasError = false;
    if (!newRole.roleJobTitle.trim()) {
      setRoleTitleError('Role (Job Title) is required.');
      hasError = true;
    }
    if (!newRole.departmentId) {
      setDepartmentError('Department is required.');
      hasError = true;
    }
    if (newRole.competencyIds.length === 0) {
      setCompetencyError('Select at least one required competency.');
      hasError = true;
    }
    if (hasError) return;

    try {
      const res = await fetch(ROLES_API + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_job_title: newRole.roleJobTitle.trim(),
          role_description: newRole.roleDescription.trim(),
          department_id: newRole.departmentId,
          created_by: user?.employee?.displayName || user?.email || 'Admin',
          status: newRole.status,
          competency_ids: newRole.competencyIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to create' }));
        setSubmitError(data.detail || 'Failed to create role');
        return;
      }
      setShowAddRoleModal(false);
      setCurrentPage(1);
      await loadAll();
    } catch {
      setSubmitError('Network error');
    }
  }

  const totalRoles = roles.length;
  const totalPages = Math.max(1, Math.ceil(totalRoles / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRoles = roles.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="libraryRole" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Role Library</h1>
                <p>Manage role definitions and required competencies.</p>
              </div>
              <div className="admin-toolbar-actions">
                <button className="admin-invite-btn" onClick={handleAddRole}>
                  <Plus size={16} />
                  Add New Role
                </button>
              </div>
            </div>

            {loading ? (
              <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>Loading roles...</div>
            ) : (
              <>
                <div className="admin-users-table-wrap">
                  <table className="admin-users-table role-library-table">
                    <thead>
                      <tr>
                        <th>Role (Job Title)</th>
                        <th>Role Description</th>
                        <th>Users in this role</th>
                        <th>Department</th>
                        <th>Required Competencies</th>
                        <th>Created by</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalRoles === 0 && (
                        <tr>
                          <td colSpan={8} className="admin-empty-state">No roles available.</td>
                        </tr>
                      )}
                      {pagedRoles.map((role) => (
                        <tr key={role.id}>
                          <td>{role.role_job_title}</td>
                          <td>{role.role_description}</td>
                          <td>{role.users_in_role}</td>
                          <td>{role.department_name}</td>
                          <td>{role.required_competencies}</td>
                          <td>{role.created_by}</td>
                          <td>
                            <span className={`admin-status-badge ${role.status === 'Active' ? 'active' : 'inactive'}`}>
                              {role.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions-cell">
                              <button className="admin-icon-action-btn" title="Copy role" onClick={() => handleCopyRole(role)}>
                                <Copy size={14} />
                              </button>
                              <button className="admin-icon-action-btn danger" title="Delete role" onClick={() => setPendingDeleteRole(role)}>
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
                  totalItems={totalRoles}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </section>
        </div>
      </div>

      {showAddRoleModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Add New Role</h3>
                <p>Create a new role with department and required competencies.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowAddRoleModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-edit-grid single-column">
              {submitError && <div className="admin-form-error">{submitError}</div>}

              <div className="admin-form-field">
                <label htmlFor="add-role-job-title">Role (Job Title)</label>
                <input
                  id="add-role-job-title"
                  className={roleTitleError ? 'admin-input-invalid' : undefined}
                  type="text"
                  value={newRole.roleJobTitle}
                  onChange={(e) => setNewRole({ ...newRole, roleJobTitle: e.target.value })}
                  placeholder="e.g. Product Manager"
                />
                {roleTitleError && <small className="admin-field-error">{roleTitleError}</small>}
              </div>

              <div className="admin-form-field">
                <label htmlFor="add-role-description">Role Description</label>
                <textarea
                  id="add-role-description"
                  rows={4}
                  value={newRole.roleDescription}
                  onChange={(e) => setNewRole({ ...newRole, roleDescription: e.target.value })}
                  placeholder="Describe the role responsibilities."
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="add-role-department">Department</label>
                <select
                  id="add-role-department"
                  className={departmentError ? 'admin-input-invalid' : undefined}
                  value={newRole.departmentId ?? ''}
                  onChange={(e) => {
                    setNewRole({ ...newRole, departmentId: e.target.value ? Number(e.target.value) : null });
                    setDepartmentError('');
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {departmentError && <small className="admin-field-error">{departmentError}</small>}
              </div>

              <div className="admin-form-field">
                <label htmlFor="add-role-status">Status</label>
                <select
                  id="add-role-status"
                  value={newRole.status}
                  onChange={(e) => setNewRole({ ...newRole, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="add-role-competencies">Required Competencies</label>
                <input
                  id="add-role-competencies"
                  className={competencyError ? 'admin-input-invalid' : undefined}
                  type="text"
                  value={competencySearchTerm}
                  placeholder="Type to filter competencies..."
                  onChange={(e) => setCompetencySearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCompetencyOptions.length > 0) {
                      e.preventDefault();
                      addRequiredCompetency(filteredCompetencyOptions[0]);
                    }
                  }}
                />

                {filteredCompetencyOptions.length > 0 && (
                  <div className="admin-suggestion-list">
                    {filteredCompetencyOptions.map((comp) => (
                      <button key={comp.id} className="admin-suggestion-item" onClick={() => addRequiredCompetency(comp)}>
                        {comp.competency_name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="admin-selected-tag-list">
                  {selectedCompetencyNames.length === 0 && (
                    <p className="admin-library-empty">No competencies selected.</p>
                  )}
                  {selectedCompetencyNames.map((c) => (
                    <span key={c.id} className="admin-selected-tag">
                      {c.name}
                      <button
                        className="admin-selected-tag-remove"
                        title="Remove competency"
                        onClick={() => setPendingDeleteRequiredCompetency(c.id)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                {competencyError && <small className="admin-field-error">{competencyError}</small>}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowAddRoleModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSubmitNewRole}>Add Role</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRole)}
        title="Delete Role"
        message={`Are you sure you want to delete "${pendingDeleteRole?.role_job_title ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteRole(null)}
        onConfirm={() => {
          if (pendingDeleteRole) handleDeleteRole(pendingDeleteRole.id);
          setPendingDeleteRole(null);
        }}
      />

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRequiredCompetency)}
        title="Remove Competency"
        message="Are you sure you want to remove this competency from the selection?"
        confirmLabel="Remove"
        onCancel={() => setPendingDeleteRequiredCompetency(null)}
        onConfirm={() => {
          if (pendingDeleteRequiredCompetency !== null) removeRequiredCompetency(pendingDeleteRequiredCompetency);
          setPendingDeleteRequiredCompetency(null);
        }}
      />
    </section>
  );
}

export default AdminRoleLibraryPage;
