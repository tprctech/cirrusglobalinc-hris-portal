import { useEffect, useRef, useState, type ChangeEvent } from 'react';
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
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { adminMockData, type AdminCompetency } from '../../data/mock/adminMockData';
import { ROUTES } from '../../app/routes';
import { profilePageMockData } from '../../data/mock/profileMockData';
import { useAuth } from '../../app/AuthContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import {
  getStoredCertifications,
  subscribeToCertificationUpdates,
  type CertificationRecord,
} from '../../data/certificationsStore';
import './ProfilePage.css';

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

function ProfilePage() {
  const { user } = useAuth();
  const emp = user?.employee;
  const profileData = {
    name: emp ? `${emp.firstName} ${emp.lastName}` : profilePageMockData.name,
    title: emp?.jobTitle || profilePageMockData.title,
    departmentTag: emp?.department || profilePageMockData.departmentTag,
    adminTag: user?.portalRole || profilePageMockData.adminTag,
    recognitionPoints: profilePageMockData.recognitionPoints,
    basicInformation: {
      department: emp?.department || profilePageMockData.basicInformation.department,
      officeLocation: emp?.officeLocation || profilePageMockData.basicInformation.officeLocation,
      birthday: emp?.birthdate || profilePageMockData.basicInformation.birthday,
      country: emp?.country || profilePageMockData.basicInformation.country,
      employeeHireDate: emp?.dateHired || profilePageMockData.basicInformation.employeeHireDate,
    },
    contactInformation: {
      email: emp?.email || profilePageMockData.contactInformation.email,
      phone: emp?.phone || profilePageMockData.contactInformation.phone,
    },
    reportingStructure: {
      reportsTo: emp?.supervisor || profilePageMockData.reportingStructure.reportsTo,
      directReports: profilePageMockData.reportingStructure.directReports,
    },
    roleInformation: profilePageMockData.roleInformation,
    profilePhoto: emp?.profilePhoto || '',
  };
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<AdminCompetency | null>(null);
  const [pendingDeleteAttachment, setPendingDeleteAttachment] = useState<UploadedAttachment | null>(null);
  const [certifications, setCertifications] = useState<CertificationRecord[]>(getStoredCertifications());
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function openCompetencyDetails(competencyName: string) {
    const matchedCompetency = adminMockData.competencies.find((competency) => (
      competency.competencyName.toLowerCase() === competencyName.toLowerCase()
    ));

    if (matchedCompetency) {
      setSelectedCompetency(matchedCompetency);
      return;
    }

    setSelectedCompetency({
      id: `profile-competency-${competencyName.toLowerCase().replace(/\s+/g, '-')}`,
      competencyCode: 'N/A',
      competencyName,
      competencyDescription: 'No competency details found in library.',
      expectations: 'No expectations found in library.',
      competencyLevel: 'Entry Level',
      competencyExperts: '',
      learningMaterials: [],
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
          {profileData.profilePhoto ? (
            <img src={profileData.profilePhoto} alt={profileData.name} className="profile-hero-avatar-img" />
          ) : (
            <div className="profile-hero-avatar">{getInitials(profileData.name)}</div>
          )}
          <div className="profile-hero-meta">
            <h2>{profileData.name}</h2>
            <p>{profileData.title}</p>
            <div className="profile-hero-tags">
              <span className="hero-tag hero-tag-primary">{profileData.adminTag}</span>
              <span className="hero-tag">{profileData.departmentTag}</span>
            </div>
            <div className="profile-hero-inline">
              <span>
                <Mail size={16} />
                {profileData.contactInformation.email}
              </span>
              <span>
                <MapPin size={16} />
                {profileData.basicInformation.officeLocation}
              </span>
            </div>
          </div>
        </div>
        <aside className="profile-hero-points">
          <Award size={24} />
          <strong>{profileData.recognitionPoints}</strong>
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
              <span>Department</span>
              <strong>{profileData.basicInformation.department}</strong>
            </div>
            <div className="profile-field">
              <span>Office Location</span>
              <strong>{profileData.basicInformation.officeLocation}</strong>
            </div>
            <div className="profile-field">
              <span>Birthday</span>
              <strong>{profileData.basicInformation.birthday}</strong>
            </div>
            <div className="profile-field">
              <span>Country</span>
              <strong>{profileData.basicInformation.country}</strong>
            </div>
            <div className="profile-field">
              <span>Employee Hire Date</span>
              <strong>{profileData.basicInformation.employeeHireDate}</strong>
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
              <strong>{profileData.contactInformation.email}</strong>
            </div>
            <div className="profile-field">
              <span>Phone</span>
              <strong>{profileData.contactInformation.phone}</strong>
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
                <div className="profile-person-pill">
                  <UserRound size={16} />
                  {profileData.reportingStructure.reportsTo}
                </div>
              </div>
            </div>
            <div className="profile-field">
              <span>
                Direct Reports ({profileData.reportingStructure.directReports.length})
              </span>
              <div className="profile-person-list">
                {profileData.reportingStructure.directReports.map((person) => (
                  <div key={person} className="profile-person-pill">
                    <UserRound size={16} />
                    {person}
                  </div>
                ))}
              </div>
            </div>
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
              <strong>{profileData.roleInformation.rolePosition}</strong>
            </div>
            <div className="profile-field">
              <span>Role Description</span>
              <strong>{profileData.roleInformation.roleDescription}</strong>
            </div>
            <div className="profile-field">
              <span>Required Competencies</span>
              <div className="profile-chip-list">
                {profileData.roleInformation.requiredCompetencies.map((competency) => (
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
          </div>
        </article>
      </div>

      <article className="profile-info-card profile-certifications-card">
        <div className="profile-card-head">
          <GraduationCap size={20} />
          <h3>Certifications Acquired</h3>
        </div>

        <div className="profile-certification-list">
          {certifications.filter((item) => item.employeeName === profileData.name).length === 0 && (
            <p>No certifications acquired yet. Complete training in L&amp;D to generate certificates.</p>
          )}

          {certifications
            .filter((item) => item.employeeName === profileData.name)
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
                <h3>{selectedCompetency.competencyName}</h3>
                <p>{selectedCompetency.competencyCode}</p>
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
                <strong>{selectedCompetency.competencyDescription || 'No description available.'}</strong>
              </div>
              <div className="profile-competency-field">
                <span>Expectations</span>
                <strong>{selectedCompetency.expectations || 'No expectations available.'}</strong>
              </div>
              <div className="profile-competency-field">
                <span>Competency Level</span>
                <strong>{selectedCompetency.competencyLevel}</strong>
              </div>
              <div className="profile-competency-field">
                <span>Competency Expert(s)</span>
                <strong>{selectedCompetency.competencyExperts || 'No experts specified.'}</strong>
              </div>
            </div>

            <div className="profile-competency-materials">
              <span>Learning Materials</span>
              {selectedCompetency.learningMaterials.length === 0 && (
                <p>No learning materials attached yet.</p>
              )}
              {selectedCompetency.learningMaterials.map((material) => (
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


