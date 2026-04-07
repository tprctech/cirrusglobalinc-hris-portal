import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, BookOpenText, Plus, Users, X } from 'lucide-react';
import { adminMockData, type AdminCompetency, type AdminUser } from '../../data/mock/adminMockData';
import { fetchEmployees, updateEmployee, deleteEmployee } from '../../api/employees';
import './AdminCenterPage.css';
import ConfirmationDialog from '../../components/ConfirmationDialog';

type AdminMenu = 'users' | 'competencyLibrary';
type SortDirection = 'asc' | 'desc';
type SortKey = 'fullName' | 'email' | 'teamflectRole' | 'supervisor' | 'department' | 'jobTitle' | 'country' | 'status' | 'actions';

type ColumnConfig = {
  label: string;
  key: SortKey;
};

const userColumns: ColumnConfig[] = [
  { label: 'Name', key: 'fullName' },
  { label: 'E-mail', key: 'email' },
  { label: 'Portal Role', key: 'teamflectRole' },
  { label: 'Supervisor', key: 'supervisor' },
  { label: 'Department', key: 'department' },
  { label: 'Job Title', key: 'jobTitle' },
  { label: 'Status', key: 'status' },
  { label: 'Country', key: 'country' },
  { label: 'Actions', key: 'actions' },
];

function getComparableValue(user: AdminUser, key: SortKey): string {
  if (key === 'actions') return '';
  if (key === 'fullName') return `${user.firstName} ${user.lastName}`;
  return String(user[key] ?? '');
}

function AdminCenterPage() {
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchUser, setInviteSearchUser] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingCompetency, setEditingCompetency] = useState<AdminCompetency | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [competencies, setCompetencies] = useState<AdminCompetency[]>(
    adminMockData.competencies as AdminCompetency[],
  );
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);
  const [pendingDeleteCompetency, setPendingDeleteCompetency] = useState<AdminCompetency | null>(null);

  useEffect(() => {
    fetchEmployees().then(setUsers).catch(() => setUsers([]));
  }, []);

  const roleFilterOptions = useMemo(() => {
    const roles = new Set(users.map((user) => user.teamflectRole));
    return ['All Roles', ...Array.from(roles).sort((a, b) => a.localeCompare(b))];
  }, [users]);

  const filteredAndSortedUsers = useMemo(() => {
    const searchText = userSearchTerm.trim().toLowerCase();
    const filtered = users.filter((user) => {
      const matchesRole = roleFilter === 'All Roles' || user.teamflectRole === roleFilter;
      if (!matchesRole) return false;
      if (!searchText) return true;

      const searchableText = [
        user.firstName, user.lastName, user.email,
        user.teamflectRole, user.supervisor, user.department,
        user.jobTitle, user.country,
      ].join(' ').toLowerCase();

      return searchableText.includes(searchText);
    });

    filtered.sort((a, b) => {
      const left = getComparableValue(a, sortKey);
      const right = getComparableValue(b, sortKey);
      const result = left.localeCompare(right, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? result : -result;
    });

    return filtered;
  }, [users, sortDirection, sortKey, userSearchTerm, roleFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  }

  function handleInviteUser() {
    if (!inviteSearchUser.trim()) return;
    setInviteSearchUser('');
    setShowInviteModal(false);
  }

  function handleEditUser(user: AdminUser) {
    setEditingUser({ ...user });
  }

  function updateEditingUserField(field: keyof AdminUser, value: string) {
    setEditingUser((previous) => {
      if (!previous) return previous;
      return { ...previous, [field]: value };
    });
  }

  async function handleSaveEditedUser() {
    if (!editingUser) return;
    if (!editingUser.firstName.trim() || !editingUser.lastName.trim()) return;
    try {
      const updated = await updateEmployee(editingUser.id, editingUser);
      setUsers((previous) => previous.map((user) => (user.id === updated.id ? updated : user)));
      setEditingUser(null);
    } catch {
      // silent
    }
  }

  async function handleDeleteUser(userId: number) {
    try {
      await deleteEmployee(userId);
      setUsers((previous) => previous.filter((user) => user.id !== userId));
    } catch {
      // silent
    }
  }

  function handleEditCompetency(competency: AdminCompetency) {
    setEditingCompetency({ ...competency });
  }

  function updateEditingCompetencyField(field: keyof AdminCompetency, value: string) {
    setEditingCompetency((previous) => {
      if (!previous) return previous;
      return { ...previous, [field]: value };
    });
  }

  function handleSaveEditedCompetency() {
    if (!editingCompetency) return;
    setCompetencies((previous) => previous.map((competency) => (
      competency.id === editingCompetency.id ? editingCompetency : competency
    )));
    setEditingCompetency(null);
  }

  function handleDeleteCompetency(competencyId: string) {
    setCompetencies((previous) => previous.filter((competency) => competency.id !== competencyId));
  }

  function getUserCellValue(user: AdminUser, key: SortKey): string {
    if (key === 'fullName') {
      const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
      return parts.join(' ') || '—';
    }
    if (key === 'actions') return '';
    return String(user[key] ?? '') || '—';
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <nav className="admin-center-sidebar">
          <h2>HR Center</h2>
          <button
            className={`admin-center-side-link ${activeMenu === 'users' ? 'active' : ''}`}
            onClick={() => setActiveMenu('users')}
          >
            <Users size={16} />
            <span>Users</span>
          </button>
          <button
            className={`admin-center-side-link ${activeMenu === 'competencyLibrary' ? 'active' : ''}`}
            onClick={() => setActiveMenu('competencyLibrary')}
          >
            <BookOpenText size={16} />
            <span>Competency Library</span>
          </button>
        </nav>

        <div className="admin-center-content">
          {activeMenu === 'users' && (
            <section className="admin-users-section">
              <div className="admin-users-toolbar">
                <div>
                  <h1>Users</h1>
                  <p>List of users who can access the application.</p>
                </div>
                <button className="admin-invite-btn" onClick={() => setShowInviteModal(true)}>
                  <Plus size={16} />
                  Invite User
                </button>
              </div>

              <div className="admin-users-filters">
                <input
                  value={userSearchTerm}
                  onChange={(event) => setUserSearchTerm(event.target.value)}
                  placeholder="Search users by name, e-mail, department, supervisor..."
                />
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  {roleFilterOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      {userColumns.map((column) => (
                        <th key={column.key}>
                          <button
                            className="admin-sort-btn"
                            onClick={() => toggleSort(column.key)}
                            title={`Sort by ${column.label}`}
                          >
                            {column.label}
                            <ArrowUpDown size={14} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedUsers.length === 0 && (
                      <tr>
                        <td colSpan={9} className="admin-empty-state">
                          No users found for the current filter.
                        </td>
                      </tr>
                    )}
                    {filteredAndSortedUsers.map((user) => (
                      <tr key={user.id}>
                        {userColumns.map((col) => (
                          <td key={col.key}>
                            {col.key === 'actions' ? (
                              <div className="admin-actions-cell">
                                <button className="admin-edit-btn" onClick={() => handleEditUser(user)}>Edit</button>
                                <button className="admin-delete-btn" onClick={() => setPendingDeleteUser(user)}>Delete</button>
                              </div>
                            ) : getUserCellValue(user, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeMenu === 'competencyLibrary' && (
            <section className="admin-users-section">
              <div className="admin-users-toolbar">
                <div>
                  <h1>Competency Library</h1>
                  <p>Manage available competencies and expectations.</p>
                </div>
              </div>

              <div className="admin-users-table-wrap">
                <table className="admin-users-table competency-table">
                  <thead>
                    <tr>
                      <th>Competency Code</th>
                      <th>Competency Name</th>
                      <th>Competency Description</th>
                      <th>Expectations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competencies.length === 0 && (
                      <tr>
                        <td colSpan={5} className="admin-empty-state">
                          No competencies available.
                        </td>
                      </tr>
                    )}
                    {competencies.map((competency) => (
                      <tr key={competency.id}>
                        <td>{competency.competencyCode}</td>
                        <td>{competency.competencyName}</td>
                        <td>{competency.competencyDescription}</td>
                        <td>{competency.expectations}</td>
                        <td>
                          <div className="admin-actions-cell">
                            <button className="admin-edit-btn" onClick={() => handleEditCompetency(competency)}>Edit</button>
                            <button className="admin-delete-btn" onClick={() => setPendingDeleteCompetency(competency)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Invite User</h3>
                <p>Search for a user and send an invite to access the portal.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowInviteModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-form-field">
              <label htmlFor="invite-user-search">Search User</label>
              <input
                id="invite-user-search"
                value={inviteSearchUser}
                onChange={(event) => setInviteSearchUser(event.target.value)}
                placeholder="Type name or e-mail"
              />
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleInviteUser}>Send Invite</button>
            </div>
          </section>
        </div>
      )}

      {editingUser && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Edit User</h3>
                <p>Update user details and save changes.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setEditingUser(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-edit-grid">
              <div className="admin-form-field">
                <label htmlFor="edit-user-first-name">First Name</label>
                <input id="edit-user-first-name" value={editingUser.firstName} onChange={(e) => updateEditingUserField('firstName', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-last-name">Last Name</label>
                <input id="edit-user-last-name" value={editingUser.lastName} onChange={(e) => updateEditingUserField('lastName', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-email">E-mail</label>
                <input id="edit-user-email" value={editingUser.email} onChange={(e) => updateEditingUserField('email', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-role">Portal Role</label>
                <select id="edit-user-role" value={editingUser.teamflectRole} onChange={(e) => updateEditingUserField('teamflectRole', e.target.value)}>
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-supervisor">Supervisor</label>
                <input id="edit-user-supervisor" value={editingUser.supervisor} onChange={(e) => updateEditingUserField('supervisor', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-department">Department</label>
                <input id="edit-user-department" value={editingUser.department} onChange={(e) => updateEditingUserField('department', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-job-title">Job Title</label>
                <input id="edit-user-job-title" value={editingUser.jobTitle} onChange={(e) => updateEditingUserField('jobTitle', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-country">Country</label>
                <input id="edit-user-country" value={editingUser.country} onChange={(e) => updateEditingUserField('country', e.target.value)} />
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveEditedUser}>Save Changes</button>
            </div>
          </section>
        </div>
      )}

      {editingCompetency && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Edit Competency</h3>
                <p>Update competency information and save changes.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setEditingCompetency(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-edit-grid single-column">
              <div className="admin-form-field">
                <label htmlFor="edit-competency-code">Competency Code</label>
                <input id="edit-competency-code" value={editingCompetency.competencyCode} onChange={(e) => updateEditingCompetencyField('competencyCode', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-name">Competency Name</label>
                <input id="edit-competency-name" value={editingCompetency.competencyName} onChange={(e) => updateEditingCompetencyField('competencyName', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-description">Competency Description</label>
                <textarea id="edit-competency-description" rows={4} value={editingCompetency.competencyDescription} onChange={(e) => updateEditingCompetencyField('competencyDescription', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-expectations">Expectations</label>
                <textarea id="edit-competency-expectations" rows={4} value={editingCompetency.expectations} onChange={(e) => updateEditingCompetencyField('expectations', e.target.value)} />
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingCompetency(null)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveEditedCompetency}>Save Changes</button>
            </div>
          </section>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteUser)}
        title="Delete User"
        message={`Are you sure you want to delete "${pendingDeleteUser ? `${pendingDeleteUser.firstName} ${pendingDeleteUser.lastName}` : ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteUser(null)}
        onConfirm={() => {
          if (pendingDeleteUser) handleDeleteUser(pendingDeleteUser.id);
          setPendingDeleteUser(null);
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteCompetency)}
        title="Delete Competency"
        message={`Are you sure you want to delete "${pendingDeleteCompetency?.competencyName ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteCompetency(null)}
        onConfirm={() => {
          if (pendingDeleteCompetency) handleDeleteCompetency(pendingDeleteCompetency.id);
          setPendingDeleteCompetency(null);
        }}
      />
    </section>
  );
}

export default AdminCenterPage;
