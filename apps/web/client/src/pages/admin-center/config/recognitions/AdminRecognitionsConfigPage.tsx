import type { MouseEvent as ReactMouseEvent } from 'react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminRecognitionsConfigPageProps = {
  onNavigate?: (path: string) => void;
};

function AdminRecognitionsConfigPage({ onNavigate }: AdminRecognitionsConfigPageProps) {
  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  function handleNavigate(path: string, event: ReactMouseEvent<HTMLButtonElement>) {
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      event.preventDefault();
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(path);
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configRecognitions" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Config &gt; Recognitions</h1>
                <p>Manage admin-side settings for the employee portal Recognitions module.</p>
              </div>
            </div>

            <div className="admin-config-action-list">
              <button
                className="admin-primary-btn"
                onClick={(event) => handleNavigate(ROUTES.adminConfigRecognitionBadges, event)}
              >
                Customize Recognition Badges
              </button>
              <button
                className="admin-secondary-btn"
                onClick={(event) => handleNavigate(ROUTES.adminConfigManageRewards, event)}
              >
                Manage Rewards
              </button>
              <button
                className="admin-secondary-btn"
                onClick={(event) => handleNavigate(ROUTES.adminConfigManageRewardRedeems, event)}
              >
                Manage Reward Redeems
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default AdminRecognitionsConfigPage;
