import { useMemo, useState } from 'react';
import { ArrowUpDown, Plus, X } from 'lucide-react';
import AdminCenterSidebar from '../../components/AdminCenterSidebar';
import AdminTablePagination from '../../components/AdminTablePagination';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { adminMockData, type AdminUser } from '../../data/mock/adminMockData';
import './AdminCenterPage.css';

type SortDirection = 'asc' | 'desc';
type SortKey = keyof AdminUser | 'actions';

type ColumnConfig = {
  label: string;
  key: SortKey;
};

type AdminUsersPageProps = {
  onNavigate?: (path: string) => void;
};

const userColumns: ColumnConfig[] = [
  { label: 'Name', key: 'name' },
  { label: 'E-mail', key: 'email' },
  { label: 'Teamflect Role', key: 'teamflectRole' },
  { label: 'Manager', key: 'manager' },
  { label: 'Attachments', key: 'attachments' },
  { label: 'Department', key: 'department' },
  { label: 'Job Title', key: 'jobTitle' },
  { label: 'Country', key: 'country' },
  { label: 'Actions', key: 'actions' },
];

const PAGE_SIZE = 8;
function getComparableValue(user: AdminUser, key: SortKey): string {
  if (key === 'actions') {
    return user.name;
  }
  return user[key];
}

function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchUser, setInviteSearchUser] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>(adminMockData.users as AdminUser[]);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const roleFilterOptions = useMemo(() => {
    const roles = new Set(users.map((user) => user.teamflectRole));
    return ['All Roles', ...Array.from(roles).sort((a, b) => a.localeCompare(b))];
  }, [users]);

  const filteredAndSortedUsers = useMemo(() => {
    const searchText = userSearchTerm.trim().toLowerCase();
    const filtered = users.filter((user) => {
      const matchesRole = roleFilter === 'All Roles' || user.teamflectRole === roleFilter;
      if (!matchesRole) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const searchableText = [
        user.name,
        user.email,
        user.teamflectRole,
        user.manager,
        user.attachments,
        user.department,
        user.jobTitle,
        user.country,
      ]
        .join(' ')
        .toLowerCase();

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

  const totalUsers = filteredAndSortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedUsers = filteredAndSortedUsers.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  }

  function handleInviteUser() {
    if (!inviteSearchUser.trim()) {
      return;
    }

    console.log('invite_user_payload', { searchUser: inviteSearchUser.trim() });
    setInviteSearchUser('');
    setShowInviteModal(false);
  }

  function handleEditUser(user: AdminUser) {
    setEditingUser({ ...user });
  }

  function updateEditingUserField(field: keyof AdminUser, value: string) {
    setEditingUser((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, [field]: value };
    });
  }

  function handleSaveEditedUser() {
    if (!editingUser) {
      return;
    }
    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      return;
    }

    console.log('edit_user_payload', { userId: editingUser.id, user: editingUser });
    setUsers((previous) => previous.map((user) => (
      user.id === editingUser.id ? editingUser : user
    )));
    setEditingUser(null);
  }

  function handleDeleteUser(userId: string) {
    console.log('delete_user_payload', { userId });
    setUsers((previous) => previous.filter((user) => user.id !== userId));
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="users" onNavigate={navigate} />

        <div className="admin-center-content">
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
                placeholder="Search users by name, e-mail, department, manager..."
              />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                {roleFilterOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
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
                  {pagedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.teamflectRole}</td>
                      <td>{user.manager}</td>
                      <td>{user.attachments}</td>
                      <td>{user.department}</td>
                      <td>{user.jobTitle}</td>
                      <td>{user.country}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-edit-btn" onClick={() => handleEditUser(user)}>
                            Edit
                          </button>
                          <button className="admin-delete-btn" onClick={() => setPendingDeleteUser(user)}>
                            Delete
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
              totalItems={totalUsers}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </section>
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
              <button className="admin-secondary-btn" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleInviteUser}>
                Send Invite
              </button>
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
                <label htmlFor="edit-user-name">Name</label>
                <input
                  id="edit-user-name"
                  value={editingUser.name}
                  onChange={(event) => updateEditingUserField('name', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-email">E-mail</label>
                <input
                  id="edit-user-email"
                  value={editingUser.email}
                  onChange={(event) => updateEditingUserField('email', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-role">Teamflect Role</label>
                <input
                  id="edit-user-role"
                  value={editingUser.teamflectRole}
                  onChange={(event) => updateEditingUserField('teamflectRole', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-manager">Manager</label>
                <input
                  id="edit-user-manager"
                  value={editingUser.manager}
                  onChange={(event) => updateEditingUserField('manager', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-attachments">Attachments</label>
                <input
                  id="edit-user-attachments"
                  value={editingUser.attachments}
                  onChange={(event) => updateEditingUserField('attachments', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-department">Department</label>
                <input
                  id="edit-user-department"
                  value={editingUser.department}
                  onChange={(event) => updateEditingUserField('department', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-job-title">Job Title</label>
                <input
                  id="edit-user-job-title"
                  value={editingUser.jobTitle}
                  onChange={(event) => updateEditingUserField('jobTitle', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-user-country">Country</label>
                <input
                  id="edit-user-country"
                  value={editingUser.country}
                  onChange={(event) => updateEditingUserField('country', event.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleSaveEditedUser}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteUser)}
        title="Delete User"
        message={`Are you sure you want to delete "${pendingDeleteUser?.name ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteUser(null)}
        onConfirm={() => {
          if (pendingDeleteUser) {
            handleDeleteUser(pendingDeleteUser.id);
          }
          setPendingDeleteUser(null);
        }}
      />
    </section>
  );
}

export default AdminUsersPage;






