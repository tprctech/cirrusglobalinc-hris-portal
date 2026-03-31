import { Copy, PenSquare, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import { adminMockData, type AdminRole } from '../../../data/mock/adminMockData';
import '../AdminCenterPage.css';

type AdminRoleLibraryPageProps = {
  onNavigate?: (path: string) => void;
};

const PAGE_SIZE = 8;

type RoleDraft = {
  roleJobTitle: string;
  roleDescription: string;
  department: string;
  requiredCompetencies: string[];
};

function getInitialRoleDraft(defaultDepartment = ''): RoleDraft {
  return {
    roleJobTitle: '',
    roleDescription: '',
    department: defaultDepartment,
    requiredCompetencies: [],
  };
}

function getInitialDepartments(): string[] {
  const departmentSet = new Set<string>();

  (adminMockData.users ?? []).forEach((user) => {
    if (user.department?.trim()) {
      departmentSet.add(user.department.trim());
    }
  });

  (adminMockData.roles ?? []).forEach((role) => {
    if (role.department?.trim()) {
      departmentSet.add(role.department.trim());
    }
  });

  return Array.from(departmentSet).sort((left, right) => left.localeCompare(right));
}

function AdminRoleLibraryPage({ onNavigate }: AdminRoleLibraryPageProps) {
  const [roles, setRoles] = useState<AdminRole[]>(adminMockData.roles as AdminRole[]);
  const [departments, setDepartments] = useState<string[]>(getInitialDepartments());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<RoleDraft>(getInitialRoleDraft(getInitialDepartments()[0] ?? ''));
  const [competencySearchTerm, setCompetencySearchTerm] = useState('');
  const [roleTitleError, setRoleTitleError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [competencyError, setCompetencyError] = useState('');
  const [pendingDeleteRole, setPendingDeleteRole] = useState<AdminRole | null>(null);
  const [pendingDeleteDepartment, setPendingDeleteDepartment] = useState<string | null>(null);
  const [pendingDeleteRequiredCompetency, setPendingDeleteRequiredCompetency] = useState<string | null>(null);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const competencyOptions = useMemo(() => {
    const uniqueNames = new Set<string>();
    adminMockData.competencies.forEach((competency) => {
      if (competency.competencyName.trim()) {
        uniqueNames.add(competency.competencyName.trim());
      }
    });
    return Array.from(uniqueNames).sort((left, right) => left.localeCompare(right));
  }, []);

  const filteredCompetencyOptions = useMemo(() => {
    const query = competencySearchTerm.trim().toLowerCase();
    return competencyOptions.filter((name) => {
      if (newRole.requiredCompetencies.includes(name)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return name.toLowerCase().includes(query);
    });
  }, [competencyOptions, competencySearchTerm, newRole.requiredCompetencies]);

  function handleAddRole() {
    setRoleTitleError('');
    setDepartmentError('');
    setCompetencyError('');
    setCompetencySearchTerm('');
    setNewRole(getInitialRoleDraft(departments[0] ?? ''));
    setShowAddRoleModal(true);
  }

  function handleEditRole(role: AdminRole) {
    console.log('edit_role_payload', { roleId: role.id });
  }

  function handleCopyRole(role: AdminRole) {
    const copyRole: AdminRole = {
      ...role,
      id: `role-copy-${Date.now()}`,
      roleJobTitle: `${role.roleJobTitle} (Copy)`,
    };
    console.log('copy_role_payload', { sourceRoleId: role.id });
    setRoles((previous) => [copyRole, ...previous]);
  }

  function handleDeleteRole(roleId: string) {
    console.log('delete_role_payload', { roleId });
    setRoles((previous) => previous.filter((role) => role.id !== roleId));
  }

  function updateNewRoleField(field: keyof RoleDraft, value: string) {
    setNewRole((previous) => ({ ...previous, [field]: value }));
  }

  function handleAddDepartment() {
    const cleanedName = newDepartmentName.trim();
    if (!cleanedName) {
      return;
    }

    const exists = departments.some((department) => department.toLowerCase() === cleanedName.toLowerCase());
    if (exists) {
      return;
    }

    setDepartments((previous) => [...previous, cleanedName].sort((left, right) => left.localeCompare(right)));
    setNewDepartmentName('');

    setNewRole((previous) => (
      previous.department
        ? previous
        : { ...previous, department: cleanedName }
    ));
  }

  function handleDeleteDepartment(departmentName: string) {
    setDepartments((previous) => previous.filter((department) => department !== departmentName));

    setRoles((previous) => previous.map((role) => (
      role.department === departmentName ? { ...role, department: 'Unassigned' } : role
    )));

    setNewRole((previous) => (
      previous.department === departmentName ? { ...previous, department: '' } : previous
    ));
  }

  function addRequiredCompetency(name: string) {
    setNewRole((previous) => {
      if (previous.requiredCompetencies.includes(name)) {
        return previous;
      }
      return { ...previous, requiredCompetencies: [...previous.requiredCompetencies, name] };
    });
    setCompetencySearchTerm('');
    setCompetencyError('');
  }

  function removeRequiredCompetency(name: string) {
    setNewRole((previous) => ({
      ...previous,
      requiredCompetencies: previous.requiredCompetencies.filter((item) => item !== name),
    }));
  }

  function handleSubmitNewRole() {
    const trimmedTitle = newRole.roleJobTitle.trim();
    const trimmedDescription = newRole.roleDescription.trim();

    setRoleTitleError('');
    setDepartmentError('');
    setCompetencyError('');

    let hasError = false;

    if (!trimmedTitle) {
      setRoleTitleError('Role (Job Title) is required.');
      hasError = true;
    }

    if (!newRole.department.trim()) {
      setDepartmentError('Department is required.');
      hasError = true;
    }

    if (newRole.requiredCompetencies.length === 0) {
      setCompetencyError('Select at least one required competency.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const role: AdminRole = {
      id: `role-${Date.now()}`,
      roleJobTitle: trimmedTitle,
      roleDescription: trimmedDescription,
      usersInRole: '0',
      department: newRole.department,
      requiredCompetencies: newRole.requiredCompetencies.join(', '),
      createdBy: 'Current Admin',
    };

    console.log('add_role_payload', { role });
    setRoles((previous) => [role, ...previous]);
    setCurrentPage(1);
    setShowAddRoleModal(false);
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
                <button className="admin-invite-btn" onClick={() => setShowDepartmentModal(true)}>
                  <Plus size={16} />
                  Add Department
                </button>
                <button className="admin-invite-btn" onClick={handleAddRole}>
                  <Plus size={16} />
                  Add New Role
                </button>
              </div>
            </div>

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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {totalRoles === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-empty-state">
                        No roles available.
                      </td>
                    </tr>
                  )}
                  {pagedRoles.map((role) => (
                    <tr key={role.id}>
                      <td>{role.roleJobTitle}</td>
                      <td>{role.roleDescription}</td>
                      <td>{role.usersInRole}</td>
                      <td>{role.department}</td>
                      <td>{role.requiredCompetencies}</td>
                      <td>{role.createdBy}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-icon-action-btn"
                            title="Edit role"
                            onClick={() => handleEditRole(role)}
                          >
                            <PenSquare size={14} />
                          </button>
                          <button
                            className="admin-icon-action-btn"
                            title="Copy role"
                            onClick={() => handleCopyRole(role)}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete role"
                            onClick={() => setPendingDeleteRole(role)}
                          >
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
          </section>
        </div>
      </div>

      {showDepartmentModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal admin-learning-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Departments</h3>
                <p>Add or remove departments used by roles.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowDepartmentModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-learning-select-grid">
              <div className="admin-form-field">
                <label htmlFor="new-department-name">Department Name</label>
                <input
                  id="new-department-name"
                  type="text"
                  value={newDepartmentName}
                  onChange={(event) => setNewDepartmentName(event.target.value)}
                  placeholder="Enter department name"
                />
              </div>
              <div className="admin-modal-actions">
                <button className="admin-primary-btn" onClick={handleAddDepartment}>
                  Add Department
                </button>
              </div>
            </div>

            <div className="admin-users-table-wrap admin-compact-modal-table-wrap">
              <table className="admin-users-table admin-compact-modal-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={2} className="admin-empty-state">
                        No departments available.
                      </td>
                    </tr>
                  )}
                  {departments.map((department) => (
                    <tr key={department}>
                      <td>{department}</td>
                      <td>
                        <button
                          className="admin-icon-action-btn danger"
                          title="Delete department"
                          onClick={() => setPendingDeleteDepartment(department)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowDepartmentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="admin-form-field">
                <label htmlFor="add-role-job-title">Role (Job Title)</label>
                <input
                  id="add-role-job-title"
                  className={roleTitleError ? 'admin-input-invalid' : undefined}
                  type="text"
                  value={newRole.roleJobTitle}
                  onChange={(event) => updateNewRoleField('roleJobTitle', event.target.value)}
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
                  onChange={(event) => updateNewRoleField('roleDescription', event.target.value)}
                  placeholder="Describe the role responsibilities."
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="add-role-department">Department</label>
                <select
                  id="add-role-department"
                  className={departmentError ? 'admin-input-invalid' : undefined}
                  value={newRole.department}
                  onChange={(event) => {
                    updateNewRoleField('department', event.target.value);
                    setDepartmentError('');
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                {departmentError && <small className="admin-field-error">{departmentError}</small>}
              </div>

              <div className="admin-form-field">
                <label htmlFor="add-role-competencies">Required Competencies</label>
                <input
                  id="add-role-competencies"
                  className={competencyError ? 'admin-input-invalid' : undefined}
                  type="text"
                  value={competencySearchTerm}
                  placeholder="Type to filter competencies..."
                  onChange={(event) => setCompetencySearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredCompetencyOptions.length > 0) {
                      event.preventDefault();
                      addRequiredCompetency(filteredCompetencyOptions[0]);
                    }
                  }}
                />

                {filteredCompetencyOptions.length > 0 && (
                  <div className="admin-suggestion-list">
                    {filteredCompetencyOptions.map((competencyName) => (
                      <button
                        key={competencyName}
                        className="admin-suggestion-item"
                        onClick={() => addRequiredCompetency(competencyName)}
                      >
                        {competencyName}
                      </button>
                    ))}
                  </div>
                )}

                <div className="admin-selected-tag-list">
                  {newRole.requiredCompetencies.length === 0 && (
                    <p className="admin-library-empty">No competencies selected.</p>
                  )}
                  {newRole.requiredCompetencies.map((competencyName) => (
                    <span key={competencyName} className="admin-selected-tag">
                      {competencyName}
                      <button
                        className="admin-selected-tag-remove"
                        title="Remove competency"
                        onClick={() => setPendingDeleteRequiredCompetency(competencyName)}
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
              <button className="admin-secondary-btn" onClick={() => setShowAddRoleModal(false)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleSubmitNewRole}>
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRole)}
        title="Delete Role"
        message={`Are you sure you want to delete "${pendingDeleteRole?.roleJobTitle ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteRole(null)}
        onConfirm={() => {
          if (pendingDeleteRole) {
            handleDeleteRole(pendingDeleteRole.id);
          }
          setPendingDeleteRole(null);
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteDepartment)}
        title="Delete Department"
        message={`Are you sure you want to delete "${pendingDeleteDepartment ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteDepartment(null)}
        onConfirm={() => {
          if (pendingDeleteDepartment) {
            handleDeleteDepartment(pendingDeleteDepartment);
          }
          setPendingDeleteDepartment(null);
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRequiredCompetency)}
        title="Remove Competency"
        message={`Are you sure you want to remove "${pendingDeleteRequiredCompetency ?? ''}" from required competencies?`}
        confirmLabel="Remove"
        onCancel={() => setPendingDeleteRequiredCompetency(null)}
        onConfirm={() => {
          if (pendingDeleteRequiredCompetency) {
            removeRequiredCompetency(pendingDeleteRequiredCompetency);
          }
          setPendingDeleteRequiredCompetency(null);
        }}
      />
    </section>
  );
}

export default AdminRoleLibraryPage;
