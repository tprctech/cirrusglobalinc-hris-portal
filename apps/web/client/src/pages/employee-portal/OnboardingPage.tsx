import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Trash2,
  Upload,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import './OnboardingPage.css';

const API = '/api/v1/onboarding';

type UploadInfo = {
  id: number;
  document_id: number;
  file_name: string;
  file_size: number;
  created_at: string | null;
};

type DocumentInfo = {
  id: number;
  title: string;
  description: string;
  sort_order: number;
  is_required: boolean;
  upload: UploadInfo | null;
};

type StepInfo = {
  id: number;
  title: string;
  description: string;
  sort_order: number;
  documents: DocumentInfo[];
  total_documents: number;
  completed_documents: number;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function OnboardingPage() {
  const { token } = useAuth();
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [uploadingDoc, setUploadingDoc] = useState<number | null>(null);
  const [removingUpload, setRemovingUpload] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  async function fetchSteps() {
    try {
      const res = await fetch(`${API}/steps`, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      const data: StepInfo[] = await res.json();
      setSteps(data);
      if (data.length > 0 && expandedSteps.size === 0) {
        setExpandedSteps(new Set([data[0].id]));
      }
    } catch {
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSteps();
  }, []);

  function toggleStep(stepId: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  async function handleUpload(documentId: number, file: File) {
    setUploadingDoc(documentId);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/documents/${documentId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Upload failed');
        return;
      }
      await fetchSteps();
    } catch {
      alert('Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleRemove(uploadId: number) {
    if (!confirm('Remove this uploaded document?')) return;
    setRemovingUpload(uploadId);
    try {
      const res = await fetch(`${API}/uploads/${uploadId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        alert('Failed to remove');
        return;
      }
      await fetchSteps();
    } catch {
      alert('Failed to remove');
    } finally {
      setRemovingUpload(null);
    }
  }

  async function handleDownload(uploadId: number, fileName: string) {
    try {
      const res = await fetch(`${API}/uploads/${uploadId}/download`, { headers });
      if (!res.ok) {
        alert('Failed to download file');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download file');
    }
  }

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-loading">Loading onboarding checklist…</div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <h1>Onboarding Checklist</h1>
      <p className="page-subtitle">
        Complete all required documents to finish your onboarding process.
      </p>

      {steps.length > 0 && (
        <div className="onboarding-stages">
          {steps.map((step, idx) => {
            const isComplete = step.completed_documents === step.total_documents && step.total_documents > 0;
            const isStarted = step.completed_documents > 0;
            const isCurrent = !isComplete && (isStarted || (idx === 0 || (steps[idx - 1].completed_documents === steps[idx - 1].total_documents && steps[idx - 1].total_documents > 0)));
            return (
              <div key={step.id} className="onboarding-stage-item">
                <div
                  className={`stage-dot ${isComplete ? 'complete' : isCurrent ? 'current' : 'upcoming'}`}
                  onClick={() => {
                    setExpandedSteps(new Set([step.id]));
                    document.getElementById(`step-${step.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {isComplete ? <CheckCircle2 size={16} /> : <span>{idx + 1}</span>}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`stage-connector ${isComplete ? 'complete' : ''}`} />
                )}
                <div className="stage-label">{step.title}</div>
              </div>
            );
          })}
        </div>
      )}

      {steps.length === 0 && (
        <div className="onboarding-empty">
          <ClipboardList size={36} />
          <p>No onboarding steps configured yet.</p>
        </div>
      )}

      {steps.map((step, idx) => {
        const isExpanded = expandedSteps.has(step.id);
        const isComplete = step.completed_documents === step.total_documents && step.total_documents > 0;
        const isStarted = step.completed_documents > 0;

        return (
          <div className="onboarding-step-card" key={step.id} id={`step-${step.id}`}>
            <div className="onboarding-step-header" onClick={() => toggleStep(step.id)}>
              <div className="onboarding-step-header-left">
                <span className={`step-number-badge ${isComplete ? 'complete' : 'incomplete'}`}>
                  {isComplete ? <CheckCircle2 size={18} /> : idx + 1}
                </span>
                <div className="step-info">
                  <h3>{step.title}</h3>
                  {step.description && <p>{step.description}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className={`step-status-badge ${isComplete ? 'complete' : isStarted ? 'in-progress' : 'not-started'}`}
                >
                  {isComplete ? (
                    <><CheckCircle2 size={14} /> Complete</>
                  ) : isStarted ? (
                    <><Clock size={14} /> {step.completed_documents}/{step.total_documents}</>
                  ) : (
                    'Not Started'
                  )}
                </span>
                <ChevronDown size={18} className={`step-chevron ${isExpanded ? 'open' : ''}`} />
              </div>
            </div>

            {isExpanded && (
              <div className="onboarding-step-body">
                <table className="onboarding-doc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '30%' }}>Document</th>
                      <th style={{ width: '25%' }}>Status</th>
                      <th style={{ width: '40%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step.documents.map((doc, dIdx) => (
                      <tr key={doc.id}>
                        <td>{dIdx + 1}</td>
                        <td>
                          <div className="doc-title-cell">
                            <span className="doc-title">{doc.title}</span>
                            {doc.description && (
                              <span className="doc-desc">{doc.description}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {doc.upload ? (
                            <span className="doc-status-pill uploaded">
                              <CheckCircle2 size={13} /> Uploaded
                            </span>
                          ) : (
                            <span className="doc-status-pill pending">
                              <Clock size={13} /> Pending
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="doc-action-cell">
                            {doc.upload ? (
                              <>
                                <div className="file-name-display">
                                  <FileText size={14} className="file-icon" />
                                  <span>{doc.upload.file_name}</span>
                                  <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>
                                    ({formatFileSize(doc.upload.file_size)})
                                  </span>
                                </div>
                                <button
                                  className="view-btn"
                                  onClick={() => handleDownload(doc.upload!.id, doc.upload!.file_name)}
                                >
                                  <Download size={14} /> View
                                </button>
                                <button
                                  className="remove-btn"
                                  disabled={removingUpload === doc.upload.id}
                                  onClick={() => handleRemove(doc.upload!.id)}
                                >
                                  {removingUpload === doc.upload.id ? (
                                    <span className="upload-spinner" />
                                  ) : (
                                    <><Trash2 size={14} /> Remove</>
                                  )}
                                </button>
                              </>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                  style={{ display: 'none' }}
                                  ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUpload(doc.id, f);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  className="upload-btn"
                                  disabled={uploadingDoc === doc.id}
                                  onClick={() => fileInputRefs.current[doc.id]?.click()}
                                >
                                  {uploadingDoc === doc.id ? (
                                    <><span className="upload-spinner" /> Uploading…</>
                                  ) : (
                                    <><Upload size={14} /> Upload</>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
