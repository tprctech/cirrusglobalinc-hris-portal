const API_BASE = '/api/v1/hr/company-resources/';

export type CompanyResource = {
  id: number;
  title: string;
  category: string;
  file_name: string;
  file_size: number;
  is_active: boolean;
  uploaded_by: string;
  is_deleted: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export async function listResources(category?: string): Promise<CompanyResource[]> {
  const url = category ? `${API_BASE}?category=${encodeURIComponent(category)}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch resources');
  return res.json();
}

export async function getResource(id: number): Promise<CompanyResource> {
  const res = await fetch(`${API_BASE}${id}`);
  if (!res.ok) throw new Error('Failed to fetch resource');
  return res.json();
}

export async function createResource(data: {
  title: string;
  category: string;
  uploaded_by: string;
  file: File;
}): Promise<CompanyResource> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('category', data.category);
  formData.append('uploaded_by', data.uploaded_by);
  formData.append('file', data.file);
  const res = await fetch(API_BASE, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create resource');
  }
  return res.json();
}

export async function updateResource(
  id: number,
  data: {
    title?: string;
    category?: string;
    is_active?: boolean;
    uploaded_by?: string;
    file?: File;
  },
): Promise<CompanyResource> {
  const formData = new FormData();
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.category !== undefined) formData.append('category', data.category);
  if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
  if (data.uploaded_by !== undefined) formData.append('uploaded_by', data.uploaded_by);
  if (data.file) formData.append('file', data.file);
  const res = await fetch(`${API_BASE}${id}`, { method: 'PUT', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update resource');
  }
  return res.json();
}

export async function deleteResource(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete resource');
}

export function downloadResource(id: number): void {
  window.open(`${API_BASE}${id}/download`, '_blank');
}
