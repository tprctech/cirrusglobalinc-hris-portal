import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Cake,
  ClipboardList,
  FileText,
  Gift,
  HeartHandshake,
  Megaphone,
  MessageSquare,
  Newspaper,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  anniversaries,
  dashboardStats,
  newsletters,
  nextSteps,
  valuesCards,
} from '../../data/mock/homeMockData';
import { listResources, downloadResource, type CompanyResource } from '../../api/companyResources';

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
  status: string;
  profile_photo: string;
};

function formatBirthdayLabel(emp: BdayEmployee): { name: string; date: string } {
  const displayName = emp.display_name || emp.last_name;
  if (!emp.birthdate) return { name: displayName, date: '' };
  const d = new Date(emp.birthdate + 'T00:00:00');
  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  return { name: displayName, date: `${month} ${day}` };
}

function HomePage() {
  const [activeTab, setActiveTab] = useState('policies');
  const [employees, setEmployees] = useState<BdayEmployee[]>([]);
  const [resources, setResources] = useState<CompanyResource[]>([]);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentMonthIdx = new Date().getMonth();

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
                <button className="download-btn" onClick={() => downloadResource(item.id)}>
                  Download
                </button>
              </div>
            ))
          )}
        </div>
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
              <div className="event-item">
                <div className="event-message" style={{ color: 'var(--gray-400)' }}>No birthdays this month</div>
              </div>
            ) : (
              birthdayCelebrants.map((emp) => {
                const label = formatBirthdayLabel(emp);
                const today = new Date();
                const bd = emp.birthdate ? new Date(emp.birthdate + 'T00:00:00') : null;
                const isToday = bd && bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
                return (
                  <div key={emp.id} className={`event-item${isToday ? ' event-item-today' : ''}`}>
                    <div className="event-name">{label.name} ({label.date}){isToday ? ' ⭐' : ''}</div>
                    <div className="event-message">{isToday ? `🎉 Happy Birthday today, ${label.name}! 🎂` : `Happy Birthday, ${label.name}! 🎂`}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="announcement-section">
            <div className="announcement-section-header">
              <Gift />
              <h3>Work Anniversaries</h3>
            </div>
            {anniversaries.map((a) => (
              <div key={a.name} className="event-item">
                <div className="event-name">{a.name}</div>
                <div className="event-message">{a.message}</div>
              </div>
            ))}
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
    </>
  );
}

export default HomePage;
