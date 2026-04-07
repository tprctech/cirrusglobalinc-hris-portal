import type { AdminUser } from '../data/mock/adminMockData';

const API_BASE = '/api/v1/hr/employees';

type ApiEmployee = {
  id: number;
  employee_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string | null;
  gender: string;
  marital_status: string;
  home_address: string;
  permanent_address: string;
  team: string;
  regularization_date: string | null;
  department: string;
  job_title: string;
  job_description: string;
  teamflect_role: string;
  date_hired: string | null;
  status: string;
  supervisor: string;
  reviewers: string;
  sss_number: string;
  hdmf_number: string;
  phil_health_number: string;
  tin: string;
  email: string;
  phone: string;
  country: string;
  office_location: string;
  profile_photo: string;
};

function isoToDisplay(iso: string | null): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
}

function displayToIso(display: string): string | null {
  if (!display) return null;
  const parts = display.split('/');
  if (parts.length !== 3) return display || null;
  const [m, d, y] = parts;
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function apiToFrontend(e: ApiEmployee): AdminUser {
  return {
    id: e.id,
    employeeId: e.employee_id,
    firstName: e.first_name,
    middleName: e.middle_name || '',
    lastName: e.last_name,
    birthdate: isoToDisplay(e.birthdate),
    gender: e.gender || '',
    maritalStatus: e.marital_status || '',
    homeAddress: e.home_address || '',
    permanentAddress: e.permanent_address || '',
    team: e.team || '',
    regularizationDate: isoToDisplay(e.regularization_date),
    department: e.department || '',
    jobTitle: e.job_title || '',
    jobDescription: e.job_description || '',
    teamflectRole: e.teamflect_role || 'Employee',
    dateHired: isoToDisplay(e.date_hired),
    status: e.status || 'Active',
    supervisor: e.supervisor || '',
    reviewers: e.reviewers || '',
    sssNumber: e.sss_number || '',
    hdmfNumber: e.hdmf_number || '',
    philHealthNumber: e.phil_health_number || '',
    tin: e.tin || '',
    email: e.email || '',
    phone: e.phone || '',
    country: e.country || '',
    officeLocation: e.office_location || '',
    profilePhoto: e.profile_photo || '',
  };
}

function frontendToApi(u: AdminUser): Record<string, unknown> {
  return {
    employee_id: u.employeeId,
    first_name: u.firstName,
    middle_name: u.middleName,
    last_name: u.lastName,
    birthdate: displayToIso(u.birthdate),
    gender: u.gender,
    marital_status: u.maritalStatus,
    home_address: u.homeAddress,
    permanent_address: u.permanentAddress,
    team: u.team,
    regularization_date: displayToIso(u.regularizationDate),
    department: u.department,
    job_title: u.jobTitle,
    job_description: u.jobDescription,
    teamflect_role: u.teamflectRole,
    date_hired: displayToIso(u.dateHired),
    status: u.status,
    supervisor: u.supervisor,
    reviewers: u.reviewers,
    sss_number: u.sssNumber,
    hdmf_number: u.hdmfNumber,
    phil_health_number: u.philHealthNumber,
    tin: u.tin,
    email: u.email,
    phone: u.phone,
    country: u.country,
    office_location: u.officeLocation,
    profile_photo: u.profilePhoto,
  };
}

export async function uploadPhoto(employeeId: number, file: File): Promise<AdminUser> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/${employeeId}/photo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err));
  }
  return apiToFrontend(await res.json());
}

export async function searchEmployees(q: string): Promise<{ id: number; employee_id: string; first_name: string; middle_name: string; last_name: string; email: string }[]> {
  const res = await fetch(`${API_BASE}/search/lookup?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEmployees(): Promise<AdminUser[]> {
  const res = await fetch(API_BASE + '/');
  if (!res.ok) throw new Error('Failed to fetch employees');
  const data: ApiEmployee[] = await res.json();
  return data.map(apiToFrontend);
}

function formatApiError(err: Record<string, unknown>): string {
  const detail = err.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: Record<string, unknown>) => {
      const loc = Array.isArray(d.loc) ? d.loc.filter((l: unknown) => l !== 'body').join(' → ') : '';
      const msg = typeof d.msg === 'string' ? d.msg : String(d.msg || '');
      return loc ? `${loc}: ${msg}` : msg;
    }).join('; ');
  }
  return 'Unknown error';
}

export async function createEmployee(user: AdminUser): Promise<AdminUser> {
  const res = await fetch(API_BASE + '/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(frontendToApi(user)),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err));
  }
  return apiToFrontend(await res.json());
}

export async function updateEmployee(id: number, user: AdminUser): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(frontendToApi(user)),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err));
  }
  return apiToFrontend(await res.json());
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete employee');
}

export async function bulkCreateEmployees(users: AdminUser[]): Promise<{ created: number; skipped: number; errors: string[] }> {
  const existing = await fetchEmployees();
  const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()).filter(Boolean));
  const existingIds = new Set(existing.map((e) => e.employeeId.toLowerCase()).filter(Boolean));
  const existingNames = new Set(existing.map((e) => `${e.firstName} ${e.lastName}`.toLowerCase().trim()));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const identifier = u.employeeId || u.firstName || `(no ID)`;
    const rowLabel = `Row ${i + 2} [${identifier}]`;

    const dupReasons: string[] = [];
    if (u.employeeId && existingIds.has(u.employeeId.toLowerCase())) {
      dupReasons.push(`Employee ID "${u.employeeId}" already exists`);
    }
    if (u.email && existingEmails.has(u.email.toLowerCase())) {
      dupReasons.push(`Email "${u.email}" already exists`);
    }
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase().trim();
    if (fullName && existingNames.has(fullName)) {
      dupReasons.push(`Name "${u.firstName} ${u.lastName}" already exists`);
    }

    if (dupReasons.length > 0) {
      skipped++;
      errors.push(`${rowLabel}: Skipped — ${dupReasons.join('; ')}`);
      continue;
    }

    try {
      const created_user = await createEmployee(u);
      created++;
      existingIds.add(u.employeeId.toLowerCase());
      if (u.email) existingEmails.add(u.email.toLowerCase());
      existingNames.add(`${created_user.firstName} ${created_user.lastName}`.toLowerCase().trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${rowLabel}: ${msg}`);
    }
  }
  return { created, skipped, errors };
}
