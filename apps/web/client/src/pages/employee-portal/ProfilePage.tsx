import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Award,
  BadgeCheck,
  Building2,
  GraduationCap,
  Mail,
  MapPin,
  Network,
  Paperclip,
  Phone,
  Shield,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { ROUTES } from '../../app/routes';
import { useAuth } from '../../app/AuthContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import {
  getStoredCertifications,
  subscribeToCertificationUpdates,
  type CertificationRecord,
} from '../../data/certificationsStore';
import './ProfilePage.css';

interface CompetencyDetail {
  id: number;
  competency_code: string;
  competency_name: string;
  competency_description: string;
  expectations: string;
  competency_level: string;
  competency_experts: string;
  learning_materials: { id: number; name: string; url: string }[];
}

interface RoleDetail {
  id: number;
  role_job_title: string;
  role_description: string;
  required_competencies: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadedAttachment = {
  id: string;
  name: string;
  size: number;
};

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${parseInt(m)}/${parseInt(d)}/${y}`;
  }
  return dateStr;
}

function ProfilePage() {
  const { user } = useAuth();
  const emp = user?.employee;

  const name = emp ? (emp.displayName || `${emp.firstName} ${emp.lastName}`) : '—';
  const profilePhoto = emp?.profilePhoto || '';

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyDetail | null>(null);
  const [pendingDeleteAttachment, setPendingDeleteAttachment] = useState<UploadedAttachment | null>(null);
  const [certifications, setCertifications] = useState<CertificationRecord[]>(getStoredCertifications());
  const [roleInfo, setRoleInfo] = useState<RoleDetail | null>(null);
  const [competencyNames, setCompetencyNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRoleInfo = useCallback(async () => {
    if (!emp?.jobTitle) return;
    try {
      const res = await fetch('/api/v1/hr/roles/');
      if (!res.ok) return;
      const roles: RoleDetail[] = await res.json();
      const match = roles.find((r) => r.role_job_title.toLowerCase() === emp.jobTitle.toLowerCase());
      if (match) {
        setRoleInfo(match);
        const compNames = (match.required_competencies || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        setCompetencyNames(compNames);
      }
    } catch {
    }
  }, [emp?.jobTitle]);

  useEffect(() => {
    loadRoleInfo();
  }, [loadRoleInfo]);

  useEffect(() => {
    const unsubscribe = subscribeToCertificationUpdates(() => {
      setCertifications(getStoredCertifications());
    });

    return unsubscribe;
  }, []);

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    const nextAttachments = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
    }));

    setAttachments((previous) => {
      const existingIds = new Set(previous.map((item) => item.id));
      const deduplicatedNew = nextAttachments.filter((item) => !existingIds.has(item.id));
      return [...previous, ...deduplicatedNew];
    });

    event.target.value = '';
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((previous) => previous.filter((item) => item.id !== attachmentId));
  }

  function openOrgChartPage() {
    if (window.location.pathname !== ROUTES.orgChart) {
      window.history.pushState({}, '', ROUTES.orgChart);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  async function openCompetencyDetails(competencyName: string) {
    try {
      const res = await fetch('/api/v1/hr/competencies/');
      if (res.ok) {
        const all: CompetencyDetail[] = await res.json();
        const match = all.find((c) => c.competency_name.toLowerCase() === competencyName.toLowerCase());
        if (match) {
          setSelectedCompetency(match);
          return;
        }
      }
    } catch {
    }
    setSelectedCompetency({
      id: 0,
      competency_code: 'N/A',
      competency_name: competencyName,
      competency_description: 'No competency details found in library.',
      expectations: 'No expectations found in library.',
      competency_level: 'Entry Level',
      competency_experts: '',
      learning_materials: [],
    });
  }

  return (
    <section className="profile-page-view">
      <header className="profile-view-title">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </header>

      <article className="profile-hero-card">
        <div className="profile-hero-main">
          {profilePhoto ? (
            <img src={profilePhoto} alt={name} className="profile-hero-avatar-img" />
          ) : (
            <div className="profile-hero-avatar">{getInitials(name)}</div>
          )}
          <div className="profile-hero-meta">
            <h2>{name}</h2>
            <p>{emp?.jobTitle || '—'}</p>
            <div className="profile-hero-tags">
              <span className="hero-tag hero-tag-primary">{user?.portalRole || '—'}</span>
              {emp?.department && <span className="hero-tag">{emp.department}</span>}
              {emp?.team && <span className="hero-tag">{emp.team}</span>}
            </div>
            <div className="profile-hero-inline">
              <span>
                <Mail size={16} />
                {emp?.email || '—'}
              </span>
              <span>
                <MapPin size={16} />
                {emp?.officeLocation || '—'}
              </span>
            </div>
          </div>
        </div>
        <aside className="profile-hero-points">
          <Award size={24} />
          <strong>0</strong>
          <p>Recognition Points</p>
        </aside>
      </article>

      <div className="profile-cards-grid">
        <article className="profile-info-card">
          <div className="profile-card-head">
            <Building2 size={20} />
            <h3>Basic Information</h3>
          </div>
          <div className="profile-field-list">
            <div className="profile-field">
              <span>Employee ID</span>
              <strong>{emp?.employeeId || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Department</span>
              <strong>{emp?.department || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Office Location</span>
              <strong>{emp?.officeLocation || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Birthday</span>
              <strong>{formatDisplayDate(emp?.birthdate || '')}</strong>
            </div>
            <div className="profile-field">
              <span>Gender</span>
              <strong>{emp?.gender || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Marital Status</span>
              <strong>{emp?.maritalStatus || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Country</span>
              <strong>{emp?.country || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Date Hired</span>
              <strong>{formatDisplayDate(emp?.dateHired || '')}</strong>
            </div>
            <div className="profile-field">
              <span>Regularization Date</span>
              <strong>{formatDisplayDate(emp?.regularizationDate || '')}</strong>
            </div>
            <div className="profile-field">
              <span>Status</span>
              <strong>{emp?.status || '—'}</strong>
            </div>
          </div>
        </article>

        <article className="profile-info-card">
          <div className="profile-card-head">
            <Phone size={20} />
            <h3>Contact Information</h3>
          </div>
          <div className="profile-field-list">
            <div className="profile-field">
              <span>Email</span>
              <strong>{emp?.email || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Phone</span>
              <strong>{emp?.phone || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Home Address</span>
              <strong>{emp?.homeAddress || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Permanent Address</span>
              <strong>{emp?.permanentAddress || '—'}</strong>
            </div>
          </div>
        </article>

        <article className="profile-info-card">
          <div className="profile-card-head">
            <div className="profile-card-head-main">
              <Users size={20} />
              <h3>Reporting Structure</h3>
            </div>
            <button
              className="profile-org-chart-btn"
              onClick={openOrgChartPage}
              title="Open Organization Chart"
              aria-label="Open Organization Chart"
            >
              <Network size={16} />
            </button>
          </div>
          <div className="profile-field-list">
            <div className="profile-field">
              <span>Reports To</span>
              <div className="profile-person-list">
                {emp?.supervisor ? (
                  <div className="profile-person-pill">
                    <UserRound size={16} />
                    {emp.supervisor}
                  </div>
                ) : <strong>—</strong>}
              </div>
            </div>
            {emp?.reviewers && (
              <div className="profile-field">
                <span>Reviewers</span>
                <div className="profile-person-list">
                  {emp.reviewers.split(',').map((r) => r.trim()).filter(Boolean).map((reviewer) => (
                    <div key={reviewer} className="profile-person-pill">
                      <UserRound size={16} />
                      {reviewer}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="profile-info-card">
          <div className="profile-card-head">
            <BadgeCheck size={20} />
            <h3>Role Information</h3>
          </div>
          <div className="profile-field-list">
            <div className="profile-field">
              <span>Role/Position</span>
              <strong>{emp?.jobTitle || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>Role Description</span>
              <strong>{roleInfo?.role_description || emp?.jobDescription || '—'}</strong>
            </div>
            {competencyNames.length > 0 && (
              <div className="profile-field">
                <span>Required Competencies</span>
                <div className="profile-chip-list">
                  {competencyNames.map((competency) => (
                    <button
                      key={competency}
                      className="profile-chip profile-chip-button"
                      onClick={() => openCompetencyDetails(competency)}
                      title={`View details for ${competency}`}
                    >
                      {competency}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="profile-info-card">
          <div className="profile-card-head">
            <Shield size={20} />
            <h3>Government IDs</h3>
          </div>
          <div className="profile-field-list">
            <div className="profile-field">
              <span>SSS Number</span>
              <strong>{emp?.sssNumber || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>HDMF / Pag-IBIG Number</span>
              <strong>{emp?.hdmfNumber || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>PhilHealth Number</span>
              <strong>{emp?.philHealthNumber || '—'}</strong>
            </div>
            <div className="profile-field">
              <span>TIN</span>
              <strong>{emp?.tin || '—'}</strong>
            </div>
          </div>
        </article>
      </div>

      <article className="profile-info-card profile-certifications-card">
        <div className="profile-card-head">
          <GraduationCap size={20} />
          <h3>Certifications Acquired</h3>
        </div>

        <div className="profile-certification-list">
          {certifications.filter((item) => item.employeeName === name).length === 0 && (
            <p>No certifications acquired yet. Complete training in L&amp;D to generate certificates.</p>
          )}

          {certifications
            .filter((item) => item.employeeName === name)
            .map((item) => (
              <div key={item.id} className="profile-certification-item">
                <div>
                  <strong>{item.trainingTitle}</strong>
                  <span>{item.competencyArea}</span>
                </div>
                <div>
                  <strong>Issued: {item.issuedOn}</strong>
                  <span>{item.credentialId}</span>
                </div>
              </div>
            ))}
        </div>
      </article>

      <article className="profile-info-card profile-attachments-card">
        <div className="profile-card-head">
          <Paperclip size={20} />
          <h3>Attachments</h3>
        </div>

        <div className="profile-attachments-actions">
          <button className="profile-upload-btn" onClick={handleOpenFilePicker}>
            Upload Attachments
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="profile-hidden-file-input"
            onChange={handleFileUpload}
          />
        </div>

        <div className="profile-attachments-list">
          {attachments.length === 0 && <p>No attachments uploaded yet.</p>}
          {attachments.map((attachment) => (
            <div key={attachment.id} className="profile-attachment-item">
              <div>
                <strong>{attachment.name}</strong>
                <span>{formatFileSize(attachment.size)}</span>
              </div>
              <button
                className="profile-attachment-remove-btn"
                onClick={() => setPendingDeleteAttachment(attachment)}
                title={`Remove ${attachment.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </article>

      {selectedCompetency && (
        <div className="profile-competency-modal-backdrop">
          <section className="profile-competency-modal">
            <div className="profile-competency-modal-header">
              <div>
                <h3>{selectedCompetency.competency_name}</h3>
                <p>{selectedCompetency.competency_code}</p>
              </div>
              <button
                className="profile-competency-close-btn"
                onClick={() => setSelectedCompetency(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="profile-competency-details">
              <div className="profile-competency-field">
                <span>Competency Description</span>
                <strong>{selectedCompetency.competency_description || 'No description available.'}</strong>
              </div>
              <div className="profile-competency-field">
                <span>Expectations</span>
                <strong>{selectedCompetency.expectations || 'No expectations available.'}</strong>
              </div>
              <div className="profile-competency-field">
                <span>Competency Level</span>
                <strong>{selectedCompetency.competency_level}</strong>
              </div>
              <div className="profile-competency-field">
                <span>Competency Expert(s)</span>
                <strong>{selectedCompetency.competency_experts || 'No experts specified.'}</strong>
              </div>
            </div>

            <div className="profile-competency-materials">
              <span>Learning Materials</span>
              {selectedCompetency.learning_materials.length === 0 && (
                <p>No learning materials attached yet.</p>
              )}
              {selectedCompetency.learning_materials.map((material) => (
                <a key={material.id} href={material.url} target="_blank" rel="noreferrer">
                  {material.name}
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteAttachment)}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${pendingDeleteAttachment?.name ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteAttachment(null)}
        onConfirm={() => {
          if (pendingDeleteAttachment) {
            removeAttachment(pendingDeleteAttachment.id);
          }
          setPendingDeleteAttachment(null);
        }}
      />
    </section>
  );
}

export default ProfilePage;


