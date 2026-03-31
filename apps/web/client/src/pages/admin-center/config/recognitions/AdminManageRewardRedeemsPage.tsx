import { useMemo, useState } from 'react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminManageRewardRedeemsPageProps = {
  onNavigate?: (path: string) => void;
};

type RedeemStatus = 'Pending' | 'Approved' | 'Rejected';

type RedeemRow = {
  id: string;
  requestedBy: string;
  userMail: string;
  rewardName: string;
  rewardPoints: number;
  redeemDate: string;
  status: RedeemStatus;
};

const initialRedeems: RedeemRow[] = [
  {
    id: 'redeem-1',
    requestedBy: 'Michael Johnson',
    userMail: 'michael.johnson@cirrus.com',
    rewardName: 'Coffee Gift Card',
    rewardPoints: 300,
    redeemDate: '2026-02-11',
    status: 'Pending',
  },
  {
    id: 'redeem-2',
    requestedBy: 'Emma Wilson',
    userMail: 'emma.wilson@cirrus.com',
    rewardName: 'Company T-Shirt',
    rewardPoints: 180,
    redeemDate: '2026-02-08',
    status: 'Approved',
  },
  {
    id: 'redeem-3',
    requestedBy: 'Noah Brown',
    userMail: 'noah.brown@cirrus.com',
    rewardName: 'Wireless Earbuds',
    rewardPoints: 900,
    redeemDate: '2026-02-03',
    status: 'Rejected',
  },
];

const PAGE_SIZE = 8;

function AdminManageRewardRedeemsPage({ onNavigate }: AdminManageRewardRedeemsPageProps) {
  const [activeTab, setActiveTab] = useState<RedeemStatus>('Pending');
  const [redeems, setRedeems] = useState<RedeemRow[]>(initialRedeems);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const filteredRedeems = useMemo(
    () => redeems.filter((item) => item.status === activeTab),
    [redeems, activeTab],
  );

  const totalRows = filteredRedeems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRedeems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  function updateRedeemStatus(id: string, status: Exclude<RedeemStatus, 'Pending'>) {
    setRedeems((previous) => previous.map((item) => (
      item.id === id ? { ...item, status } : item
    )));
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

            <div className="admin-tab-list" role="tablist" aria-label="Redeem status tabs">
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

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Requested By</th>
                    <th>User Mail</th>
                    <th>Reward Name</th>
                    <th>Reward Points</th>
                    <th>Redeem Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {totalRows === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-empty-state">
                        No redeems found for this status.
                      </td>
                    </tr>
                  )}
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.requestedBy}</td>
                      <td>{row.userMail}</td>
                      <td>{row.rewardName}</td>
                      <td>{row.rewardPoints}</td>
                      <td>{row.redeemDate}</td>
                      <td>
                        {row.status === 'Pending' ? (
                          <div className="admin-actions-cell">
                            <button
                              className="admin-compact-action-btn approve"
                              onClick={() => updateRedeemStatus(row.id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="admin-compact-action-btn reject"
                              onClick={() => updateRedeemStatus(row.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          row.status
                        )}
                      </td>
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
