import { useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminRecognitionBadgesPageProps = {
  onNavigate?: (path: string) => void;
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

const PAGE_SIZE = 8;

function AdminRecognitionBadgesPage({ onNavigate }: AdminRecognitionBadgesPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(badgeRows);
  const [pendingDeleteBadgeId, setPendingDeleteBadgeId] = useState<string | null>(null);
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
                  <span>Customize Recognition Badges</span>
                </h1>
              </div>
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
                  {pagedRows.map((row) => (
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
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete badge"
                            onClick={() => setPendingDeleteBadgeId(row.id)}
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
        isOpen={Boolean(pendingDeleteBadgeId)}
        title="Delete Badge"
        message="Are you sure you want to delete this recognition badge?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteBadgeId(null)}
        onConfirm={() => {
          if (pendingDeleteBadgeId) {
            setRows((previous) => previous.filter((row) => row.id !== pendingDeleteBadgeId));
          }
          setPendingDeleteBadgeId(null);
        }}
      />
    </section>
  );
}

export default AdminRecognitionBadgesPage;
