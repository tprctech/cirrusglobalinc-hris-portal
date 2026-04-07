const API_BASE = '/api/v1/auth';

export interface EmployeeProfile {
  id: number;
  employeeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  jobDescription: string;
  team: string;
  supervisor: string;
  reviewers: string;
  status: string;
  portalRole: string;
  country: string;
  officeLocation: string;
  birthdate: string;
  dateHired: string;
  profilePhoto: string;
  gender: string;
  maritalStatus: string;
  homeAddress: string;
}

export interface AuthUser {
  id: number;
  email: string;
  portalRole: string;
  employee: EmployeeProfile | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'cirrus_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(data.detail || 'Login failed');
  }
  return res.json();
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Session expired');
  }
  return res.json();
}

export async function resetEmployeePassword(employeeId: number): Promise<{ message: string; email: string }> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/reset-password/${employeeId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Reset failed' }));
    throw new Error(data.detail || 'Failed to reset password');
  }
  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Failed to change password' }));
    throw new Error(data.detail || 'Failed to change password');
  }
  return res.json();
}
