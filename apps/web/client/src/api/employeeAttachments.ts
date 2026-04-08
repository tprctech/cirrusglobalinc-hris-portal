const API_BASE = '/api/v1/hr/employees';

export type EmployeeAttachment = {
  id: number;
  employee_id: number;
  file_name: string;
  file_size: number;
  is_deleted: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export async function listAttachments(employeeId: number): Promise<EmployeeAttachment[]> {
  const res = await fetch(`${API_BASE}/${employeeId}/attachments`);
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
}

export async function uploadAttachment(employeeId: number, file: File): Promise<EmployeeAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/${employeeId}/attachments`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload attachment');
  }
  return res.json();
}

export async function deleteAttachment(employeeId: number, attachmentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${employeeId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete attachment');
}

export function downloadAttachment(employeeId: number, attachmentId: number): void {
  window.open(`${API_BASE}/${employeeId}/attachments/${attachmentId}/download`, '_blank');
}
