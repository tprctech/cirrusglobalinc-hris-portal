import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Camera, Download, Plus, Settings2, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminCenterSidebar from '../../components/AdminCenterSidebar';
import AdminTablePagination from '../../components/AdminTablePagination';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import type { AdminUser } from '../../data/mock/adminMockData';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, bulkCreateEmployees, uploadPhoto, searchEmployees } from '../../api/employees';
import { resetEmployeePassword } from '../../api/auth';
import './AdminCenterPage.css';

type SortDirection = 'asc' | 'desc';
type ColumnKey = keyof AdminUser | 'fullName' | 'actions';

type ColumnConfig = {
  label: string;
  key: ColumnKey;
  defaultVisible: boolean;
};

type AdminUsersPageProps = {
  onNavigate?: (path: string) => void;
};

const ALL_COLUMNS: ColumnConfig[] = [
  { label: 'Employee ID', key: 'employeeId', defaultVisible: false },
  { label: 'Name', key: 'fullName', defaultVisible: true },
  { label: 'E-mail', key: 'email', defaultVisible: true },
  { label: 'Department', key: 'department', defaultVisible: false },
  { label: 'Job Title', key: 'jobTitle', defaultVisible: false },
  { label: 'Portal Role', key: 'teamflectRole', defaultVisible: true },
  { label: 'Status', key: 'status', defaultVisible: false },
  { label: 'Supervisor', key: 'supervisor', defaultVisible: false },
  { label: 'Phone', key: 'phone', defaultVisible: false },
  { label: 'Gender', key: 'gender', defaultVisible: false },
  { label: 'Marital Status', key: 'maritalStatus', defaultVisible: false },
  { label: 'Team', key: 'team', defaultVisible: false },
  { label: 'Country', key: 'country', defaultVisible: false },
  { label: 'Office Location', key: 'officeLocation', defaultVisible: false },
  { label: 'Date Hired', key: 'dateHired', defaultVisible: false },
  { label: 'Regularization Date', key: 'regularizationDate', defaultVisible: false },
  { label: 'Birthdate', key: 'birthdate', defaultVisible: false },
  { label: 'Reviewers', key: 'reviewers', defaultVisible: false },
  { label: 'SSS Number', key: 'sssNumber', defaultVisible: false },
  { label: 'HDMF Number', key: 'hdmfNumber', defaultVisible: false },
  { label: 'PhilHealth Number', key: 'philHealthNumber', defaultVisible: false },
  { label: 'TIN', key: 'tin', defaultVisible: false },
  { label: 'Actions', key: 'actions', defaultVisible: true },
];

const DEFAULT_VISIBLE = new Set(
  ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
);

function emptyUser(): AdminUser {
  return {
    id: 0,
    employeeId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthdate: '',
    gender: '',
    maritalStatus: '',
    homeAddress: '',
    permanentAddress: '',
    team: '',
    regularizationDate: '',
    department: '',
    jobTitle: '',
    jobDescription: '',
    teamflectRole: 'Employee',
    dateHired: '',
    status: 'Active',
    supervisor: '',
    reviewers: '',
    sssNumber: '',
    hdmfNumber: '',
    philHealthNumber: '',
    tin: '',
    email: '',
    phone: '',
    country: '',
    officeLocation: '',
    profilePhoto: '',
  };
}

const PAGE_SIZE = 8;

function getComparableValue(user: AdminUser, key: ColumnKey): string {
  if (key === 'actions') return '';
  if (key === 'fullName') return `${user.firstName} ${user.lastName}`;
  const val = user[key];
  return String(val ?? '');
}

const TEMPLATE_HEADERS = [
  'Employee ID *',
  'First Name *',
  'Middle Name',
  'Last Name *',
  'Email',
  'Phone',
  'Birthdate',
  'Gender',
  'Marital Status',
  'Home Address',
  'Permanent Address',
  'Team',
  'Regularization Date',
  'Department',
  'Job Title',
  'Job Description',
  'Portal Role',
  'Date Hired',
  'Status',
  'Supervisor',
  'Reviewers',
  'SSS Number',
  'HDMF Number',
  'PhilHealth Number',
  'TIN',
  'Country',
  'Office Location',
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const colWidths = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 18) }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  XLSX.writeFile(wb, 'Employee_Upload_Template.xlsx');
}

function normalizeExcelDate(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    const utcDays = Math.floor(val - 25569);
    const ms = utcDays * 86400 * 1000;
    const d = new Date(ms);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  }
  const s = String(val).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${parseInt(isoMatch[2])}/${parseInt(isoMatch[3])}/${isoMatch[1]}`;
  }
  return s;
}

const PORTAL_ROLE_MAP: Record<string, string> = { employee: 'Employee', manager: 'Manager', hr: 'HR', admin: 'Admin' };
function normalizePortalRole(val: string): string {
  return PORTAL_ROLE_MAP[val.trim().toLowerCase()] || 'Employee';
}

function parseExcelToUsers(data: ArrayBuffer): AdminUser[] {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  return rows.map((row) => ({
    id: 0,
    employeeId: String(row['Employee ID *'] || row['Employee ID'] || ''),
    firstName: String(row['First Name *'] || row['First Name'] || ''),
    middleName: String(row['Middle Name'] || ''),
    lastName: String(row['Last Name *'] || row['Last Name'] || ''),
    email: String(row['Email'] || ''),
    phone: String(row['Phone'] || ''),
    birthdate: normalizeExcelDate(row['Birthdate']),
    gender: String(row['Gender'] || ''),
    maritalStatus: String(row['Marital Status'] || ''),
    homeAddress: String(row['Home Address'] || ''),
    permanentAddress: String(row['Permanent Address'] || ''),
    team: String(row['Team'] || ''),
    regularizationDate: normalizeExcelDate(row['Regularization Date']),
    department: String(row['Department'] || ''),
    jobTitle: String(row['Job Title'] || ''),
    jobDescription: String(row['Job Description'] || ''),
    teamflectRole: normalizePortalRole(String(row['Portal Role'] || row['Teamflect Role'] || 'Employee')),
    dateHired: normalizeExcelDate(row['Date Hired']),
    status: String(row['Status'] || 'Active'),
    supervisor: String(row['Supervisor'] || ''),
    reviewers: String(row['Reviewers'] || ''),
    sssNumber: String(row['SSS Number'] || ''),
    hdmfNumber: String(row['HDMF Number'] || ''),
    philHealthNumber: String(row['PhilHealth Number'] || ''),
    tin: String(row['TIN'] || ''),
    country: String(row['Country'] || ''),
    officeLocation: String(row['Office Location'] || ''),
    profilePhoto: '',
  }));
}

function displayToIsoForPicker(display: string): string {
  if (!display) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return '';
  const [m, d, y] = parts;
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function isoToDisplayForPicker(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
}

function DatePickerField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (val: string) => void }) {
  const isoVal = displayToIsoForPicker(value);
  return (
    <div className="admin-form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        value={isoVal}
        onChange={(e) => onChange(isoToDisplayForPicker(e.target.value))}
      />
    </div>
  );
}

type LookupResult = { id: number; employee_id: string; first_name: string; middle_name: string; last_name: string; email: string };

function EmployeeSearchField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (val: string) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (val.length >= 1) {
        const res = await searchEmployees(val);
        setResults(res);
        setOpen(true);
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 250);
  }

  function select(r: LookupResult) {
    const name = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ');
    const display = r.email ? `${name} (${r.email})` : name;
    setQuery(display);
    onChange(display);
    setOpen(false);
  }

  return (
    <div className="admin-form-field" ref={ref} style={{ position: 'relative' }}>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={query} onChange={(e) => handleInput(e.target.value)} onFocus={() => { if (results.length > 0) setOpen(true); }} autoComplete="off" />
      {open && results.length > 0 && (
        <ul className="admin-search-dropdown">
          {results.map((r) => (
            <li key={r.id} onClick={() => select(r)}>
              <span className="admin-search-name">{r.first_name} {r.middle_name ? r.middle_name + ' ' : ''}{r.last_name}</span>
              {r.email && <span className="admin-search-email">{r.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewerMultiSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (val: string) => void }) {
  const reviewers = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (val.length >= 1) {
        const res = await searchEmployees(val);
        setResults(res);
        setOpen(true);
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 250);
  }

  function addReviewer(r: LookupResult) {
    const name = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ');
    const display = r.email ? `${name} (${r.email})` : name;
    if (!reviewers.includes(display)) {
      const updated = [...reviewers, display].join(', ');
      onChange(updated);
    }
    setQuery('');
    setOpen(false);
  }

  function removeReviewer(idx: number) {
    const updated = reviewers.filter((_, i) => i !== idx).join(', ');
    onChange(updated);
  }

  return (
    <div className="admin-form-field full-width" ref={ref} style={{ position: 'relative' }}>
      <label htmlFor={id}>{label}</label>
      {reviewers.length > 0 && (
        <div className="admin-reviewer-tags">
          {reviewers.map((r, i) => (
            <span key={i} className="admin-reviewer-tag">
              {r}
              <button type="button" onClick={() => removeReviewer(i)} className="admin-reviewer-tag-remove"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <input id={id} value={query} onChange={(e) => handleInput(e.target.value)} onFocus={() => { if (results.length > 0) setOpen(true); }} placeholder="Search to add reviewer..." autoComplete="off" />
      {open && results.length > 0 && (
        <ul className="admin-search-dropdown">
          {results.map((r) => (
            <li key={r.id} onClick={() => addReviewer(r)}>
              <span className="admin-search-name">{r.first_name} {r.middle_name ? r.middle_name + ' ' : ''}{r.last_name}</span>
              {r.email && <span className="admin-search-email">{r.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfilePhotoUpload({ user, onPhotoUploaded }: { user: AdminUser; onPhotoUploaded: (updated: AdminUser) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user.id) return;
    setUploading(true);
    try {
      const updated = await uploadPhoto(user.id, file);
      onPhotoUploaded(updated);
    } catch {
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="admin-photo-upload">
      <div className="admin-photo-preview" onClick={() => fileRef.current?.click()}>
        {user.profilePhoto ? (
          <img src={user.profilePhoto} alt="Profile" />
        ) : (
          <div className="admin-photo-placeholder">
            <Camera size={28} />
            <span>Upload Photo</span>
          </div>
        )}
        {uploading && <div className="admin-photo-uploading">Uploading...</div>}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}

function UserFormFields({
  user,
  onChange,
  prefix,
  isEditing = false,
  onPhotoUploaded,
}: {
  user: AdminUser;
  onChange: (field: keyof AdminUser, value: string) => void;
  prefix: string;
  isEditing?: boolean;
  onPhotoUploaded?: (updated: AdminUser) => void;
}) {
  return (
    <div className="admin-user-form-sections">
      {isEditing && onPhotoUploaded && (
        <div className="admin-form-photo-row">
          <ProfilePhotoUpload user={user} onPhotoUploaded={onPhotoUploaded} />
        </div>
      )}

      <fieldset className="admin-form-section">
        <legend>Employee Identity</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-employeeId`}>Employee ID <span className="required">*</span></label>
            <input id={`${prefix}-employeeId`} value={user.employeeId} onChange={(e) => onChange('employeeId', e.target.value)} required readOnly={isEditing} style={isEditing ? { opacity: 0.6, cursor: 'not-allowed' } : undefined} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-firstName`}>First Name <span className="required">*</span></label>
            <input id={`${prefix}-firstName`} value={user.firstName} onChange={(e) => onChange('firstName', e.target.value)} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-middleName`}>Middle Name</label>
            <input id={`${prefix}-middleName`} value={user.middleName} onChange={(e) => onChange('middleName', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-lastName`}>Last Name <span className="required">*</span></label>
            <input id={`${prefix}-lastName`} value={user.lastName} onChange={(e) => onChange('lastName', e.target.value)} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-email`}>Email</label>
            <input id={`${prefix}-email`} type="email" value={user.email} onChange={(e) => onChange('email', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-phone`}>Phone</label>
            <input id={`${prefix}-phone`} value={user.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="e.g. +63 917 123 4567" />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Personal Information</legend>
        <div className="admin-edit-grid">
          <DatePickerField id={`${prefix}-birthdate`} label="Birthdate" value={user.birthdate} onChange={(v) => onChange('birthdate', v)} />
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-gender`}>Gender</label>
            <select id={`${prefix}-gender`} value={user.gender} onChange={(e) => onChange('gender', e.target.value)}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-maritalStatus`}>Marital Status</label>
            <select id={`${prefix}-maritalStatus`} value={user.maritalStatus} onChange={(e) => onChange('maritalStatus', e.target.value)}>
              <option value="">— Select —</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-country`}>Country</label>
            <input id={`${prefix}-country`} value={user.country} onChange={(e) => onChange('country', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Address</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field full-width">
            <label htmlFor={`${prefix}-homeAddress`}>Home Address</label>
            <input id={`${prefix}-homeAddress`} value={user.homeAddress} onChange={(e) => onChange('homeAddress', e.target.value)} />
          </div>
          <div className="admin-form-field full-width">
            <label htmlFor={`${prefix}-permanentAddress`}>Permanent Address</label>
            <input id={`${prefix}-permanentAddress`} value={user.permanentAddress} onChange={(e) => onChange('permanentAddress', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Employment Details</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-department`}>Department</label>
            <input id={`${prefix}-department`} value={user.department} onChange={(e) => onChange('department', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-jobTitle`}>Job Title</label>
            <input id={`${prefix}-jobTitle`} value={user.jobTitle} onChange={(e) => onChange('jobTitle', e.target.value)} />
          </div>
          <div className="admin-form-field full-width">
            <label htmlFor={`${prefix}-jobDescription`}>Job Description</label>
            <textarea id={`${prefix}-jobDescription`} rows={2} value={user.jobDescription} onChange={(e) => onChange('jobDescription', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-teamflectRole`}>Portal Role</label>
            <select id={`${prefix}-teamflectRole`} value={user.teamflectRole} onChange={(e) => onChange('teamflectRole', e.target.value)}>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-team`}>Team</label>
            <input id={`${prefix}-team`} value={user.team} onChange={(e) => onChange('team', e.target.value)} />
          </div>
          <DatePickerField id={`${prefix}-dateHired`} label="Date Hired" value={user.dateHired} onChange={(v) => onChange('dateHired', v)} />
          <DatePickerField id={`${prefix}-regularizationDate`} label="Regularization Date" value={user.regularizationDate} onChange={(v) => onChange('regularizationDate', v)} />
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-status`}>Status</label>
            <select id={`${prefix}-status`} value={user.status} onChange={(e) => onChange('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-officeLocation`}>Office Location</label>
            <input id={`${prefix}-officeLocation`} value={user.officeLocation} onChange={(e) => onChange('officeLocation', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Reporting & Reviews</legend>
        <div className="admin-edit-grid">
          <EmployeeSearchField id={`${prefix}-supervisor`} label="Supervisor" value={user.supervisor} onChange={(v) => onChange('supervisor', v)} />
          <ReviewerMultiSelect id={`${prefix}-reviewers`} label="Reviewers" value={user.reviewers} onChange={(v) => onChange('reviewers', v)} />
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend>Government IDs</legend>
        <div className="admin-edit-grid">
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-sssNumber`}>SSS Number</label>
            <input id={`${prefix}-sssNumber`} value={user.sssNumber} onChange={(e) => onChange('sssNumber', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-hdmfNumber`}>HDMF Number</label>
            <input id={`${prefix}-hdmfNumber`} value={user.hdmfNumber} onChange={(e) => onChange('hdmfNumber', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-philHealthNumber`}>PhilHealth Number</label>
            <input id={`${prefix}-philHealthNumber`} value={user.philHealthNumber} onChange={(e) => onChange('philHealthNumber', e.target.value)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor={`${prefix}-tin`}>TIN</label>
            <input id={`${prefix}-tin`} value={user.tin} onChange={(e) => onChange('tin', e.target.value)} />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newUser, setNewUser] = useState<AdminUser>(emptyUser);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<ColumnKey>('employeeId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => new Set(DEFAULT_VISIBLE));
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkParsed, setBulkParsed] = useState<AdminUser[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [formError, setFormError] = useState('');
  const [resetResult, setResetResult] = useState<{ email: string; message: string } | null>(null);
  const [pendingResetUser, setPendingResetUser] = useState<AdminUser | null>(null);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

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
        user.employeeId, user.firstName, user.middleName, user.lastName,
        user.email, user.phone, user.teamflectRole, user.supervisor,
        user.department, user.jobTitle, user.country, user.team,
        user.status, user.officeLocation,
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
        if (key !== 'fullName' && key !== 'actions' && key !== 'employeeId') next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleAddUser() {
    if (!newUser.employeeId.trim() || !newUser.firstName.trim() || !newUser.lastName.trim()) {
      setFormError('Employee ID, First Name, and Last Name are required.');
      return;
    }
    setFormError('');
    try {
      const created = await createEmployee(newUser);
      setUsers((prev) => [...prev, created]);
      setNewUser(emptyUser());
      setShowAddModal(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create employee');
    }
  }

  function updateNewUserField(field: keyof AdminUser, value: string) {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditUser(user: AdminUser) {
    setEditingUser({ ...user });
    setFormError('');
  }

  function updateEditingUserField(field: keyof AdminUser, value: string) {
    setEditingUser((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }

  async function handleSaveEditedUser() {
    if (!editingUser) return;
    if (!editingUser.employeeId.trim() || !editingUser.firstName.trim() || !editingUser.lastName.trim()) {
      setFormError('Employee ID, First Name, and Last Name are required.');
      return;
    }
    setFormError('');
    try {
      const updated = await updateEmployee(editingUser.id, editingUser);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update employee');
    }
  }

  async function handleDeleteUser(userId: number) {
    try {
      await deleteEmployee(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // silent
    }
  }

  async function handleResetPassword(user: AdminUser) {
    try {
      const result = await resetEmployeePassword(user.id);
      setResetResult(result);
    } catch (err: unknown) {
      setResetResult({ email: '', message: err instanceof Error ? err.message : 'Reset failed' });
    }
    setPendingResetUser(null);
  }

  function handleBulkFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      if (data instanceof ArrayBuffer) {
        const parsed = parseExcelToUsers(data);
        setBulkParsed(parsed);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleBulkUpload() {
    if (bulkParsed.length === 0) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const result = await bulkCreateEmployees(bulkParsed);
      setBulkResult(result);
      if (result.created > 0) {
        await loadUsers();
      }
    } finally {
      setBulkUploading(false);
    }
  }

  function closeBulkModal() {
    setShowBulkModal(false);
    setBulkFile(null);
    setBulkParsed([]);
    setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function renderCellValue(user: AdminUser, key: ColumnKey) {
    if (key === 'actions') {
      return (
        <div className="admin-actions-cell">
          <button className="admin-edit-btn" onClick={() => handleEditUser(user)}>Edit</button>
          <button className="admin-reset-pwd-btn" onClick={() => setPendingResetUser(user)}>Reset Password</button>
          <button className="admin-delete-btn" onClick={() => setPendingDeleteUser(user)}>Delete</button>
        </div>
      );
    }
    if (key === 'fullName') {
      const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
      return parts.join(' ') || '—';
    }
    const val = user[key as keyof AdminUser];
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
              <div className="admin-toolbar-actions">
                <button className="admin-secondary-btn" onClick={downloadTemplate}>
                  <Download size={16} />
                  Download Template
                </button>
                <button className="admin-secondary-btn" onClick={() => setShowBulkModal(true)}>
                  <Upload size={16} />
                  Bulk Upload
                </button>
                <button className="admin-invite-btn" onClick={() => { setShowAddModal(true); setFormError(''); }}>
                  <Plus size={16} />
                  Add User
                </button>
              </div>
            </div>

            <div className="admin-users-filters">
              <input
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search users by name, employee ID, department, supervisor..."
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
                          disabled={col.key === 'fullName'}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</div>
            ) : (
              <>
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
                            No users found. Add a user or upload an Excel file to get started.
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
              </>
            )}
          </section>
        </div>
      </div>

      {showAddModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add User</h3>
                <p>Fill in the information below to create a new user. Fields marked with * are required.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            {formError && <div className="admin-form-error">{formError}</div>}

            <UserFormFields
              user={newUser}
              onChange={updateNewUserField}
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

            {formError && <div className="admin-form-error">{formError}</div>}

            <UserFormFields
              user={editingUser}
              onChange={updateEditingUserField}
              prefix="edit"
              isEditing
              onPhotoUploaded={(updated) => {
                setEditingUser(updated);
                setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
              }}
            />

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveEditedUser}>Save Changes</button>
            </div>
          </section>
        </div>
      )}

      {showBulkModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Bulk Upload Users</h3>
                <p>Upload an Excel file (.xlsx) to create multiple users at once. Download the template first to see the correct format.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={closeBulkModal}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-bulk-upload-body">
              <div className="admin-bulk-upload-actions">
                <button className="admin-secondary-btn" onClick={downloadTemplate}>
                  <Download size={16} />
                  Download Template
                </button>
              </div>

              <div className="admin-form-field">
                <label htmlFor="bulk-file">Select Excel File</label>
                <input
                  id="bulk-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleBulkFileChange}
                />
              </div>

              {bulkFile && bulkParsed.length > 0 && (
                <div className="admin-bulk-preview">
                  <p><strong>{bulkParsed.length}</strong> row(s) found in "{bulkFile.name}"</p>
                  <div className="admin-bulk-preview-table-wrap">
                    <table className="admin-users-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Employee ID</th>
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Job Title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkParsed.slice(0, 10).map((u, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{u.employeeId || '—'}</td>
                            <td>{u.firstName || '—'}</td>
                            <td>{u.lastName || '—'}</td>
                            <td>{u.email || '—'}</td>
                            <td>{u.department || '—'}</td>
                            <td>{u.jobTitle || '—'}</td>
                          </tr>
                        ))}
                        {bulkParsed.length > 10 && (
                          <tr>
                            <td colSpan={7} className="admin-empty-state">
                              ...and {bulkParsed.length - 10} more row(s)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkFile && bulkParsed.length === 0 && (
                <p className="admin-form-error">No valid rows found in the uploaded file. Please check the format.</p>
              )}

              {bulkResult && (
                <div className="admin-bulk-result">
                  <p className="admin-bulk-result-success">{bulkResult.created} user(s) created successfully.{bulkResult.skipped > 0 && ` ${bulkResult.skipped} skipped (duplicates).`}</p>
                  {bulkResult.errors.length > 0 && (
                    <div className="admin-bulk-result-errors">
                      <p><strong>{bulkResult.errors.length} error(s):</strong></p>
                      <ul>
                        {bulkResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={closeBulkModal}>Close</button>
              <button
                className="admin-primary-btn"
                onClick={handleBulkUpload}
                disabled={bulkParsed.length === 0 || bulkUploading}
              >
                {bulkUploading ? 'Uploading...' : `Upload ${bulkParsed.length} User(s)`}
              </button>
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
        isOpen={Boolean(pendingResetUser)}
        title="Reset Password"
        message={`Reset password for "${pendingResetUser ? `${pendingResetUser.firstName} ${pendingResetUser.lastName}` : ''}" to the default (cirrus${new Date().getFullYear()})?`}
        confirmLabel="Reset"
        onCancel={() => setPendingResetUser(null)}
        onConfirm={() => {
          if (pendingResetUser) handleResetPassword(pendingResetUser);
        }}
      />

      {resetResult && (
        <div className="admin-modal-backdrop" onClick={() => setResetResult(null)}>
          <div className="admin-reset-result-popup" onClick={(e) => e.stopPropagation()}>
            <p>{resetResult.message}</p>
            {resetResult.email && <p>Account: <strong>{resetResult.email}</strong></p>}
            <button className="admin-primary-btn" onClick={() => setResetResult(null)}>OK</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminUsersPage;
