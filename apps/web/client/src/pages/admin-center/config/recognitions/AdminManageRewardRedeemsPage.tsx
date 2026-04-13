import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminManageRewardRedeemsPageProps = {
  onNavigate?: (path: string) => void;
};

type RedeemStatus = 'Pending' | 'Approved' | 'Rejected';

type RedeemRow = {
  id: number;
  requested_by: string;
  user_mail: string;
  reward_name: string;
  reward_points: number;
  redeem_date: string | null;
  status: RedeemStatus;
};

const API = '/api/v1/hr/recognitions/redeems';
const PAGE_SIZE = 8;

function AdminManageRewardRedeemsPage({ onNavigate }: AdminManageRewardRedeemsPageProps) {
  const [activeTab, setActiveTab] = useState<RedeemStatus>('Pending');
  const [redeems, setRedeems] = useState<RedeemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const loadRedeems = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (res.ok) setRedeems(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadRedeems(); }, [loadRedeems]);

  const filteredRedeems = useMemo(() => {
    let items = redeems.filter((item) => item.status === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((item) => item.requested_by.toLowerCase().includes(q));
    }
    return items;
  }, [redeems, activeTab, searchQuery]);

  const totalRows = filteredRedeems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRedeems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  async function updateRedeemStatus(id: number, status: Exclude<RedeemStatus, 'Pending'>) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API.replace('/redeems', '')}/redeems/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await loadRedeems();
    } catch (err) {
      console.error('Failed to update redeem status', err);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(d: string | null): string {
    if (!d) return '—';
    const [year, month, day] = d.split('-');
    if (!year || !month || !day) return d;
    return `${Number(month)}/${Number(day)}/${year}`;
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configRecognitions" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1 className="admin-breadcrumb-title">
                  <button className="admin-breadcrumb-link" onClick={() => navigate(ROUTES.adminConfigRecognitions)}>
                    Recognitions
                  </button>
                  <span>&gt;</span>
                  <span>Manage Reward Redeems</span>
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="admin-tab-list" role="tablist" aria-label="Redeem status tabs" style={{ flex: 1 }}>
                {(['Pending', 'Approved', 'Rejected'] as RedeemStatus[]).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="text"
                  placeholder="Search by Requested By..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 30px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Requested By</th>
                    <th>Requested By Email</th>
                    <th>Reward Name</th>
                    <th>Reward Points</th>
                    <th>Redeem Date</th>
                    {activeTab === 'Pending' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={activeTab === 'Pending' ? 6 : 5} className="admin-empty-state">Loading...</td></tr>
                  )}
                  {!loading && totalRows === 0 && (
                    <tr>
                      <td colSpan={activeTab === 'Pending' ? 6 : 5} className="admin-empty-state">
                        No {activeTab.toLowerCase()} redeems found.
                      </td>
                    </tr>
                  )}
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.requested_by}</td>
                      <td>{row.user_mail}</td>
                      <td>{row.reward_name}</td>
                      <td>{row.reward_points}</td>
                      <td>{formatDate(row.redeem_date)}</td>
                      {activeTab === 'Pending' && (
                        <td>
                          <div className="admin-actions-cell">
                            <button
                              className="admin-compact-action-btn approve"
                              disabled={saving}
                              onClick={() => updateRedeemStatus(row.id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="admin-compact-action-btn reject"
                              disabled={saving}
                              onClick={() => updateRedeemStatus(row.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination
              currentPage={safeCurrentPage}
              totalItems={totalRows}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
      </div>
    </section>
  );
}

export default AdminManageRewardRedeemsPage;
