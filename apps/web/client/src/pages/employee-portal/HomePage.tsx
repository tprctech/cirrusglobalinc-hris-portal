import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Cake,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Gift,
  HeartHandshake,
  Megaphone,
  MessageSquare,
  Newspaper,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  dashboardStats,
  newsletters,
  nextSteps,
  valuesCards,
} from '../../data/mock/homeMockData';
import { listResources, type CompanyResource } from '../../api/companyResources';

const statIcons: Record<string, React.ReactNode> = {
  'clipboard-list': <ClipboardList size={22} />,
  'trending-up': <TrendingUp size={22} />,
  award: <Award size={22} />,
  users: <Users size={22} />,
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type BdayEmployee = {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  birthdate: string | null;
  date_hired: string | null;
  status: string;
  profile_photo: string;
};

function getDisplayName(emp: BdayEmployee): string {
  return emp.display_name || [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.last_name;
}

function formatBirthdayLabel(emp: BdayEmployee): { name: string; date: string } {
  const displayName = getDisplayName(emp);
  if (!emp.birthdate) return { name: displayName, date: '' };
  const d = new Date(emp.birthdate + 'T00:00:00');
  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  return { name: displayName, date: `${month} ${day}` };
}

function formatAnniversaryLabel(emp: BdayEmployee): { name: string; date: string; years: number } {
  const displayName = getDisplayName(emp);
  if (!emp.date_hired) return { name: displayName, date: '', years: 0 };
  const d = new Date(emp.date_hired + 'T00:00:00');
  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) {
    years--;
  }
  return { name: displayName, date: `${month} ${day}`, years };
}

function getFileExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase();
}

function isPreviewable(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

function HomePage() {
  const [activeTab, setActiveTab] = useState('policies');
  const [employees, setEmployees] = useState<BdayEmployee[]>([]);
  const [resources, setResources] = useState<CompanyResource[]>([]);
  const [previewResource, setPreviewResource] = useState<CompanyResource | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentMonthIdx = new Date().getMonth();

  useEffect(() => {
    if (!previewResource) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      return;
    }
    setPreviewLoading(true);
    fetch(`/api/v1/hr/company-resources/${previewResource.id}/download`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load file');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
      })
      .catch(() => setPreviewBlobUrl(null))
      .finally(() => setPreviewLoading(false));
    return () => {};
  }, [previewResource]);

  useEffect(() => {
    listResources()
      .then((data) => setResources(data.filter((r) => r.is_active)))
      .catch(() => {});
  }, []);

  const policyResources = resources.filter((r) => r.category === 'Policies');
  const handbookResources = resources.filter((r) => r.category === 'Employee Handbook');

  useEffect(() => {
    fetch('/api/v1/hr/employees/')
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch(() => {});
  }, []);

  const birthdayCelebrants = useMemo(() => {
    return employees
      .filter((emp) => {
        if (emp.status !== 'Active' || !emp.birthdate) return false;
        const d = new Date(emp.birthdate + 'T00:00:00');
        return d.getMonth() === currentMonthIdx;
      })
      .sort((a, b) => {
        const da = new Date(a.birthdate! + 'T00:00:00').getDate();
        const db = new Date(b.birthdate! + 'T00:00:00').getDate();
        return da - db;
      });
  }, [employees, currentMonthIdx]);

  const anniversaryCelebrants = useMemo(() => {
    return employees
      .filter((emp) => {
        if (emp.status !== 'Active' || !emp.date_hired) return false;
        const d = new Date(emp.date_hired + 'T00:00:00');
        if (d.getMonth() !== currentMonthIdx) return false;
        const years = new Date().getFullYear() - d.getFullYear();
        return years >= 1;
      })
      .sort((a, b) => {
        const da = new Date(a.date_hired! + 'T00:00:00').getDate();
        const db = new Date(b.date_hired! + 'T00:00:00').getDate();
        return da - db;
      });
  }, [employees, currentMonthIdx]);

  return (
    <>
      <div className="card purpose-card">
        <div className="card-header">
          <HeartHandshake />
          <h2>Our Purpose</h2>
        </div>
        <p className="purpose-quote">
          "We transform lives and business by connecting global talent with great job opportunities."
        </p>
      </div>

      <div className="values-grid">
        {valuesCards.map((value) => (
          <div key={value.title} className="card value-card">
            <h2>{value.title}</h2>
            <p>{value.description}</p>
          </div>
        ))}
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
            <div className="stat-icon">{statIcons[stat.icon]}</div>
          </div>
        ))}
      </div>

      <div className="card announcement-card">
        <div className="card-header">
          <Megaphone />
          <h2>Announcements</h2>
        </div>

        <div className="announcement-sections">
          <div className="announcement-section">
            <div className="announcement-section-header">
              <Cake />
              <h3>{currentMonth} Birthday Celebrants</h3>
            </div>
            {birthdayCelebrants.length === 0 ? (
              <div className="bday-empty">No birthdays this month</div>
            ) : (
              <div className="bday-grid">
                {birthdayCelebrants.map((emp) => {
                  const label = formatBirthdayLabel(emp);
                  const today = new Date();
                  const bd = emp.birthdate ? new Date(emp.birthdate + 'T00:00:00') : null;
                  const isToday = bd && bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
                  return (
                    <div key={emp.id} className={`bday-chip${isToday ? ' bday-chip-today' : ''}`}>
                      <span className="bday-chip-icon">{isToday ? '⭐' : '🎂'}</span>
                      <div className="bday-chip-info">
                        <span className="bday-chip-name">{label.name}</span>
                        <span className="bday-chip-date">{label.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="announcement-section">
            <div className="announcement-section-header">
              <Gift />
              <h3>{currentMonth} Work Anniversaries</h3>
            </div>
            {anniversaryCelebrants.length === 0 ? (
              <div className="bday-empty">No work anniversaries this month</div>
            ) : (
              <div className="bday-grid">
                {anniversaryCelebrants.map((emp) => {
                  const label = formatAnniversaryLabel(emp);
                  const today = new Date();
                  const hd = emp.date_hired ? new Date(emp.date_hired + 'T00:00:00') : null;
                  const isToday = hd && hd.getMonth() === today.getMonth() && hd.getDate() === today.getDate();
                  return (
                    <div key={emp.id} className={`bday-chip${isToday ? ' bday-chip-today' : ''}`}>
                      <span className="bday-chip-icon">{isToday ? '⭐' : '🎉'}</span>
                      <div className="bday-chip-info">
                        <span className="bday-chip-name">{label.name}</span>
                        <span className="bday-chip-date">{label.date} &middot; {label.years} {label.years === 1 ? 'year' : 'years'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="announcement-section">
            <div className="announcement-section-header">
              <Newspaper />
              <h3>Newsletter</h3>
            </div>
            {newsletters.map((item) => (
              <div key={item.title} className="event-item">
                <div className="event-name">{item.title}</div>
                <div className="event-message">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card resources-card">
        <div className="card-header">
          <FileText />
          <h2>Company Resources</h2>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            Policies
          </button>
          <button
            className={`tab ${activeTab === 'handbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('handbook')}
          >
            Employee Handbook
          </button>
        </div>
        <div>
          {(activeTab === 'policies' ? policyResources : handbookResources).length === 0 ? (
            <div className="policy-item">
              <div className="policy-info">
                <div className="policy-icon"><FileText /></div>
                <div><div className="policy-name" style={{ color: 'var(--gray-400)' }}>No {activeTab === 'policies' ? 'policies' : 'handbook items'} uploaded yet</div></div>
              </div>
            </div>
          ) : (
            (activeTab === 'policies' ? policyResources : handbookResources).map((item) => (
              <div key={item.id} className="policy-item">
                <div className="policy-info">
                  <div className="policy-icon">
                    <FileText />
                  </div>
                  <div>
                    <div className="policy-name">{item.title}</div>
                    <div className="policy-date">Updated: {item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</div>
                  </div>
                </div>
                <button className="download-btn" onClick={() => {
                  if (isPreviewable(item.file_name)) {
                    setPreviewResource(item);
                  } else {
                    window.open(`/api/v1/hr/company-resources/${item.id}/download`, '_blank');
                  }
                }}>
                  <Eye size={14} />
                  Preview
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card voe-card">
        <div className="card-header">
          <MessageSquare />
          <h2>Voice of Employee</h2>
        </div>
        <p className="voe-description">
          Share your anonymous feedback to help us improve our workplace
          environment and culture.
        </p>
        <textarea
          className="voe-textarea"
          placeholder="Type your anonymous feedback here..."
        />
        <button className="submit-btn">Submit Feedback</button>
      </div>

      <div className="card whats-next-card">
        <div className="card-header">
          <ClipboardList />
          <h2>What's Next</h2>
        </div>
        <div className="next-steps-grid">
          {nextSteps.map((item) => (
            <div key={item.title} className="next-step-item">
              <div className="next-step-title">{item.title}</div>
              <div className="next-step-detail">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
      {previewResource && (
        <div className="resource-preview-backdrop" onClick={() => setPreviewResource(null)}>
          <div className="resource-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resource-preview-header">
              <div className="resource-preview-title">
                <FileText size={18} />
                <span>{previewResource.title}</span>
              </div>
              <div className="resource-preview-actions">
                <a
                  className="resource-preview-download-btn"
                  href={`/api/v1/hr/company-resources/${previewResource.id}/download?disposition=attachment`}
                  download={previewResource.file_name}
                >
                  <Download size={14} />
                  Download
                </a>
                <button className="resource-preview-close-btn" onClick={() => setPreviewResource(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="resource-preview-body">
              {previewLoading ? (
                <div className="resource-preview-loading">Loading preview...</div>
              ) : previewBlobUrl ? (
                isImageFile(previewResource.file_name) ? (
                  <img
                    src={previewBlobUrl}
                    alt={previewResource.title}
                    className="resource-preview-image"
                  />
                ) : (
                  <iframe
                    src={previewBlobUrl}
                    title={previewResource.title}
                    className="resource-preview-iframe"
                  />
                )
              ) : (
                <div className="resource-preview-loading">Unable to load preview</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HomePage;
