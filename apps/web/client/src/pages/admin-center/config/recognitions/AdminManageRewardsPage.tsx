import { useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminManageRewardsPageProps = {
  onNavigate?: (path: string) => void;
};

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

const PAGE_SIZE = 8;

function AdminManageRewardsPage({ onNavigate }: AdminManageRewardsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(rewardRows);
  const [pendingDeleteRewardId, setPendingDeleteRewardId] = useState<string | null>(null);
  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

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
                  <span>Manage Rewards</span>
                </h1>
              </div>
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
                  {pagedRows.map((row) => (
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
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete reward"
                            onClick={() => setPendingDeleteRewardId(row.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRewardId)}
        title="Delete Reward"
        message="Are you sure you want to delete this reward?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteRewardId(null)}
        onConfirm={() => {
          if (pendingDeleteRewardId) {
            setRows((previous) => previous.filter((row) => row.id !== pendingDeleteRewardId));
          }
          setPendingDeleteRewardId(null);
        }}
      />
    </section>
  );
}

export default AdminManageRewardsPage;
