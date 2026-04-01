import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, ChevronDown, Plus, Settings2, X } from 'lucide-react';
import AdminCenterSidebar from '../../components/AdminCenterSidebar';
import AdminTablePagination from '../../components/AdminTablePagination';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { adminMockData, type AdminUser, type AdminRole } from '../../data/mock/adminMockData';
import './AdminCenterPage.css';

type SortDirection = 'asc' | 'desc';
type ColumnKey = keyof AdminUser | 'actions';

type ColumnConfig = {
  label: string;
  key: ColumnKey;
  defaultVisible: boolean;
};

type AdminUsersPageProps = {
  onNavigate?: (path: string) => void;
};

const ALL_COLUMNS: ColumnConfig[] = [
  { label: 'Name', key: 'name', defaultVisible: true },
  { label: 'Title', key: 'title', defaultVisible: false },
  { label: 'E-mail', key: 'email', defaultVisible: true },
  { label: 'Phone', key: 'phone', defaultVisible: false },
  { label: 'Teamflect Role', key: 'teamflectRole', defaultVisible: true },
  { label: 'Department', key: 'department', defaultVisible: true },
  { label: 'Office Location', key: 'officeLocation', defaultVisible: false },
  { label: 'Birthday', key: 'birthday', defaultVisible: false },
  { label: 'Country', key: 'country', defaultVisible: true },
  { label: 'Hire Date', key: 'employeeHireDate', defaultVisible: false },
  { label: 'Manager', key: 'manager', defaultVisible: true },
  { label: 'Reports To', key: 'reportsTo', defaultVisible: false },
  { label: 'Job Title', key: 'jobTitle', defaultVisible: true },
  { label: 'Role Position', key: 'rolePosition', defaultVisible: false },
  { label: 'Attachments', key: 'attachments', defaultVisible: false },
  { label: 'Actions', key: 'actions', defaultVisible: true },
];

const DEFAULT_VISIBLE = new Set(
  ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
);

function emptyUser(): AdminUser {
  return {
    id: '',
    name: '',
    title: '',
    email: '',
    phone: '',
    teamflectRole: 'Employee',
    department: '',
    officeLocation: '',
    birthday: '',
    country: '',
    employeeHireDate: '',
    manager: '',
    reportsTo: '',
    directReports: [],
    jobTitle: '',
    rolePosition: '',
    attachments: '',
  };
}

const PAGE_SIZE = 8;

function getComparableValue(user: AdminUser, key: ColumnKey): string {
  if (key === 'actions') return user.name;
  const val = user[key];
  if (Array.isArray(val)) return val.join(', ');
  return val;
}

let userIdCounter = 100;

function UserFormFields({
  user,
  onChange,
  onDirectReportsChange,
  allUsers,
  roles,
  prefix,
}: {
  user: AdminUser;
  onChange: (field: keyof AdminUser, value: string) => void;
  onDirectReportsChange: (reports: string[]) => void;
  allUsers: AdminUser[];
  roles: AdminRole[];
  prefix: string;
}) {
  const [drDropdownOpen, setDrDropdownOpen] = useState(false);
  const drRef = useRef<HTMLDivElement>(null);

  const userNames = useMemo(
    () => allUsers.map((u) => u.name).filter((n) => n !== user.name),
    [allUsers, user.name],
  );

  const toggleDirectReport = useCallback(
    (name: string) => {
      const next = user.directReports.includes(name)
        ? user.directReports.filter((n) => n !== name)
        : [...user.directReports, name];
      onDirectReportsChange(next);
    },
    [user.directReports, onDirectReportsChange],
  );

  return (
    <div className="admin-user-form-sections">
      <fieldset className="admin-form-section">
        <legend>Profile Header</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-name`}>Full Name</label>
            <input id={`${prefix}-name`} value={user.name} onChange={(e) => onChange('name', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-title`}>Title</label>
            <input id={`${prefix}-title`} value={user.title} onChange={(e) => onChange('title', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-teamflectRole`}>Teamflect Role</label>
            <select id={`${prefix}-teamflectRole`} value={user.teamflectRole} onChange={(e) => onChange('teamflectRole', e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-department`}>Department</label>
            <input id={`${prefix}-department`} value={user.department} onChange={(e) => onChange('department', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Basic Information</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-officeLocation`}>Office Location</label>
            <input id={`${prefix}-officeLocation`} value={user.officeLocation} onChange={(e) => onChange('officeLocation', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-birthday`}>Birthday</label>
            <input id={`${prefix}-birthday`} value={user.birthday} onChange={(e) => onChange('birthday', e.target.value)} placeholder="e.g. November 20, 1985" />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-country`}>Country</label>
            <input id={`${prefix}-country`} value={user.country} onChange={(e) => onChange('country', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-employeeHireDate`}>Employee Hire Date</label>
            <input id={`${prefix}-employeeHireDate`} value={user.employeeHireDate} onChange={(e) => onChange('employeeHireDate', e.target.value)} placeholder="e.g. January 15, 2015" />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Contact Information</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-email`}>E-mail</label>
            <input id={`${prefix}-email`} type="email" value={user.email} onChange={(e) => onChange('email', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-phone`}>Phone</label>
            <input id={`${prefix}-phone`} value={user.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="e.g. +1 (555) 111-2222" />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Reporting Structure</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-reportsTo`}>Reports To</label>
            <select id={`${prefix}-reportsTo`} value={user.reportsTo} onChange={(e) => { onChange('reportsTo', e.target.value); onChange('manager', e.target.value); }}>
              <option value="">— Select —</option>
              <option value="Executive Team">Executive Team</option>
              {userNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-field">
            <label>Direct Reports</label>
            <div className="admin-multi-select" ref={drRef}>
              <button type="button" className="admin-multi-select-trigger" onClick={() => setDrDropdownOpen((p) => !p)}>
                <span className="admin-multi-select-label">
                  {user.directReports.length > 0
                    ? `${user.directReports.length} selected`
                    : 'Select direct reports'}
                </span>
                <ChevronDown size={14} />
              </button>
              {drDropdownOpen && (
                <div className="admin-multi-select-dropdown">
                  {userNames.map((name) => (
                    <label key={name} className="admin-multi-select-option">
                      <input
                        type="checkbox"
                        checked={user.directReports.includes(name)}
                        onChange={() => toggleDirectReport(name)}
                      />
                      {name}
                    </label>
                  ))}
                  {userNames.length === 0 && <span className="admin-multi-select-empty">No other users available</span>}
                </div>
              )}
            </div>
            {user.directReports.length > 0 && (
              <div className="admin-selected-pills">
                {user.directReports.map((name) => (
                  <span key={name} className="admin-pill">
                    {name}
                    <button type="button" onClick={() => toggleDirectReport(name)} aria-label={`Remove ${name}`}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Role Information</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-jobTitle`}>Job Title</label>
            <input id={`${prefix}-jobTitle`} value={user.jobTitle} onChange={(e) => onChange('jobTitle', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-rolePosition`}>Role Position</label>
            <select id={`${prefix}-rolePosition`} value={user.rolePosition} onChange={(e) => onChange('rolePosition', e.target.value)}>
              <option value="">— None —</option>
              {roles.map((role) => (
                <option key={role.id} value={role.roleJobTitle}>{role.roleJobTitle} ({role.department})</option>
              ))}
            </select>
            <small>Linked from HR Center &gt; Library &gt; Role</small>
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-attachments`}>Attachments</label>
            <input id={`${prefix}-attachments`} value={user.attachments} onChange={(e) => onChange('attachments', e.target.value)} />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<AdminUser>(emptyUser);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>(adminMockData.users as AdminUser[]);
  const [sortKey, setSortKey] = useState<ColumnKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => new Set(DEFAULT_VISIBLE));
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  const roles = adminMockData.roles as AdminRole[];

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const roleFilterOptions = useMemo(() => {
    const rolesSet = new Set(users.map((user) => user.teamflectRole));
    return ['All Roles', ...Array.from(rolesSet).sort((a, b) => a.localeCompare(b))];
  }, [users]);

  const activeColumns = useMemo(
    () => ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)),
    [visibleColumns],
  );

  const filteredAndSortedUsers = useMemo(() => {
    const searchText = userSearchTerm.trim().toLowerCase();
    const filtered = users.filter((user) => {
      const matchesRole = roleFilter === 'All Roles' || user.teamflectRole === roleFilter;
      if (!matchesRole) return false;
      if (!searchText) return true;

      const searchableText = [
        user.name, user.title, user.email, user.phone,
        user.teamflectRole, user.manager, user.attachments,
        user.department, user.jobTitle, user.country,
        user.officeLocation, user.reportsTo, user.rolePosition,
        ...user.directReports,
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

  const totalUsers = filteredAndSortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedUsers = filteredAndSortedUsers.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  function toggleSort(key: ColumnKey) {
    if (sortKey === key) {
      setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  }

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (key !== 'name' && key !== 'actions') next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleAddUser() {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    userIdCounter += 1;
    const created: AdminUser = { ...newUser, id: `admin-user-${userIdCounter}` };
    setUsers((prev) => [...prev, created]);
    setNewUser(emptyUser());
    setShowAddModal(false);
  }

  function updateNewUserField(field: keyof AdminUser, value: string) {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditUser(user: AdminUser) {
    setEditingUser({ ...user, directReports: [...user.directReports] });
  }

  function updateEditingUserField(field: keyof AdminUser, value: string) {
    setEditingUser((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }

  function handleSaveEditedUser() {
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.email.trim()) return;
    setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
    setEditingUser(null);
  }

  function handleDeleteUser(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function renderCellValue(user: AdminUser, key: ColumnKey) {
    if (key === 'actions') {
      return (
        <div className="admin-actions-cell">
          <button className="admin-edit-btn" onClick={() => handleEditUser(user)}>Edit</button>
          <button className="admin-delete-btn" onClick={() => setPendingDeleteUser(user)}>Delete</button>
        </div>
      );
    }
    if (key === 'directReports') {
      return user.directReports.length > 0 ? user.directReports.join(', ') : '—';
    }
    const val = user[key];
    return val || '—';
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
              <button className="admin-invite-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Add User
              </button>
            </div>

            <div className="admin-users-filters">
              <input
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search users by name, e-mail, department, manager..."
              />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                {roleFilterOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <div className="admin-column-picker-wrap" ref={columnPickerRef}>
                <button
                  className="admin-column-picker-btn"
                  onClick={() => setShowColumnPicker((p) => !p)}
                  title="Choose visible columns"
                >
                  <Settings2 size={15} />
                  Columns
                </button>
                {showColumnPicker && (
                  <div className="admin-column-picker-dropdown">
                    <span className="admin-column-picker-title">Show / Hide Columns</span>
                    {ALL_COLUMNS.filter((c) => c.key !== 'actions').map((col) => (
                      <label key={col.key} className="admin-column-picker-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.key)}
                          disabled={col.key === 'name'}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    {activeColumns.map((column) => (
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
                      <td colSpan={activeColumns.length} className="admin-empty-state">
                        No users found for the current filter.
                      </td>
                    </tr>
                  )}
                  {pagedUsers.map((user) => (
                    <tr key={user.id}>
                      {activeColumns.map((col) => (
                        <td key={col.key}>{renderCellValue(user, col.key)}</td>
                      ))}
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

      {showAddModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add User</h3>
                <p>Fill in the information below to create a new user.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <UserFormFields
              user={newUser}
              onChange={updateNewUserField}
              onDirectReportsChange={(dr) => setNewUser((p) => ({ ...p, directReports: dr }))}
              allUsers={users}
              roles={roles}
              prefix="add"
            />

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleAddUser}>Add User</button>
            </div>
          </section>
        </div>
      )}

      {editingUser && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Edit User</h3>
                <p>Update user details and save changes.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setEditingUser(null)}>
                <X size={16} />
              </button>
            </div>

            <UserFormFields
              user={editingUser}
              onChange={updateEditingUserField}
              onDirectReportsChange={(dr) => setEditingUser((p) => p ? { ...p, directReports: dr } : p)}
              allUsers={users}
              roles={roles}
              prefix="edit"
            />

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveEditedUser}>Save Changes</button>
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
          if (pendingDeleteUser) handleDeleteUser(pendingDeleteUser.id);
          setPendingDeleteUser(null);
        }}
      />
    </section>
  );
}

export default AdminUsersPage;
