import { useMemo, useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import '../../AdminCenterPage.css';

type AdminRecognitionsConfigPageProps = {
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

const badgeRows = [
  {
    id: 'badge-1',
    image: 'Trophy',
    title: 'Top Performer',
    description: 'Awarded to employees with outstanding quarterly performance.',
    isOfficial: 'Yes',
    point: 150,
    isActive: 'Yes',
  },
  {
    id: 'badge-2',
    image: 'Handshake',
    title: 'Team Player',
    description: 'Recognizes collaboration and cross-team support.',
    isOfficial: 'No',
    point: 80,
    isActive: 'Yes',
  },
];

const rewardRows = [
  {
    id: 'reward-1',
    rewardName: 'Coffee Gift Card',
    rewardDescription: 'Redeemable gift card for local coffee shops.',
    rewardCategory: 'Gift Card',
    requiredPoint: 300,
    isActive: 'Yes',
  },
  {
    id: 'reward-2',
    rewardName: 'Company T-Shirt',
    rewardDescription: 'Official company merch t-shirt.',
    rewardCategory: 'Merchandise',
    requiredPoint: 180,
    isActive: 'Yes',
  },
];

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

function AdminRecognitionsConfigPage({ onNavigate }: AdminRecognitionsConfigPageProps) {
  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const [badges, setBadges] = useState(badgeRows);
  const [badgePage, setBadgePage] = useState(1);
  const [pendingDeleteBadgeId, setPendingDeleteBadgeId] = useState<string | null>(null);

  const [rewards, setRewards] = useState(rewardRows);
  const [rewardPage, setRewardPage] = useState(1);
  const [pendingDeleteRewardId, setPendingDeleteRewardId] = useState<string | null>(null);

  const [redeems, setRedeems] = useState<RedeemRow[]>(initialRedeems);
  const [redeemTab, setRedeemTab] = useState<RedeemStatus>('Pending');
  const [redeemPage, setRedeemPage] = useState(1);

  const badgeTotalPages = Math.max(1, Math.ceil(badges.length / PAGE_SIZE));
  const badgeSafePage = Math.min(badgePage, badgeTotalPages);
  const badgePagedRows = badges.slice((badgeSafePage - 1) * PAGE_SIZE, badgeSafePage * PAGE_SIZE);

  const rewardTotalPages = Math.max(1, Math.ceil(rewards.length / PAGE_SIZE));
  const rewardSafePage = Math.min(rewardPage, rewardTotalPages);
  const rewardPagedRows = rewards.slice((rewardSafePage - 1) * PAGE_SIZE, rewardSafePage * PAGE_SIZE);

  const filteredRedeems = useMemo(
    () => redeems.filter((item) => item.status === redeemTab),
    [redeems, redeemTab],
  );
  const redeemTotalPages = Math.max(1, Math.ceil(filteredRedeems.length / PAGE_SIZE));
  const redeemSafePage = Math.min(redeemPage, redeemTotalPages);
  const redeemPagedRows = filteredRedeems.slice((redeemSafePage - 1) * PAGE_SIZE, redeemSafePage * PAGE_SIZE);

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
          <div className="admin-users-toolbar">
            <div>
              <h1>Configuration &gt; Recognitions</h1>
              <p>Manage admin-side settings for the employee portal Recognitions module.</p>
            </div>
          </div>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Customize Recognition Badges</h2></div>
              <button className="admin-invite-btn">Add</button>
            </div>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Is Official</th>
                    <th>Point</th>
                    <th>Is Active</th>
                    <th>Actions Button</th>
                  </tr>
                </thead>
                <tbody>
                  {badgePagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.image}</td>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td>{row.isOfficial}</td>
                      <td>{row.point}</td>
                      <td>{row.isActive}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit badge">
                            <PenSquare size={14} />
                          </button>
                          <button className="admin-icon-action-btn danger" title="Delete badge" onClick={() => setPendingDeleteBadgeId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={badgeSafePage} totalItems={badges.length} pageSize={PAGE_SIZE} onPageChange={setBadgePage} />
          </section>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Manage Rewards</h2></div>
              <button className="admin-invite-btn">Create New Reward</button>
            </div>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Reward Name</th>
                    <th>Reward Description</th>
                    <th>Reward Category</th>
                    <th>Required Point</th>
                    <th>Is Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rewardPagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.rewardName}</td>
                      <td>{row.rewardDescription}</td>
                      <td>{row.rewardCategory}</td>
                      <td>{row.requiredPoint}</td>
                      <td>{row.isActive}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit reward">
                            <PenSquare size={14} />
                          </button>
                          <button className="admin-icon-action-btn danger" title="Delete reward" onClick={() => setPendingDeleteRewardId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={rewardSafePage} totalItems={rewards.length} pageSize={PAGE_SIZE} onPageChange={setRewardPage} />
          </section>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Manage Reward Redeems</h2></div>
            </div>
            <div className="admin-tab-list" role="tablist" aria-label="Redeem status tabs">
              {(['Pending', 'Approved', 'Rejected'] as RedeemStatus[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={redeemTab === tab}
                  className={`admin-tab-btn ${redeemTab === tab ? 'active' : ''}`}
                  onClick={() => { setRedeemTab(tab); setRedeemPage(1); }}
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
                  {filteredRedeems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-empty-state">
                        No redeems found for this status.
                      </td>
                    </tr>
                  )}
                  {redeemPagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.requestedBy}</td>
                      <td>{row.userMail}</td>
                      <td>{row.rewardName}</td>
                      <td>{row.rewardPoints}</td>
                      <td>{row.redeemDate}</td>
                      <td>
                        {row.status === 'Pending' ? (
                          <div className="admin-actions-cell">
                            <button className="admin-compact-action-btn approve" onClick={() => updateRedeemStatus(row.id, 'Approved')}>
                              Approve
                            </button>
                            <button className="admin-compact-action-btn reject" onClick={() => updateRedeemStatus(row.id, 'Rejected')}>
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
            <AdminTablePagination currentPage={redeemSafePage} totalItems={filteredRedeems.length} pageSize={PAGE_SIZE} onPageChange={setRedeemPage} />
          </section>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteBadgeId)}
        title="Delete Badge"
        message="Are you sure you want to delete this recognition badge?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteBadgeId(null)}
        onConfirm={() => {
          if (pendingDeleteBadgeId) setBadges((previous) => previous.filter((row) => row.id !== pendingDeleteBadgeId));
          setPendingDeleteBadgeId(null);
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRewardId)}
        title="Delete Reward"
        message="Are you sure you want to delete this reward?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteRewardId(null)}
        onConfirm={() => {
          if (pendingDeleteRewardId) setRewards((previous) => previous.filter((row) => row.id !== pendingDeleteRewardId));
          setPendingDeleteRewardId(null);
        }}
      />
    </section>
  );
}

export default AdminRecognitionsConfigPage;
