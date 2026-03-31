import type { MouseEvent as ReactMouseEvent } from 'react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminSurveysConfigPageProps = {
  onNavigate?: (path: string) => void;
};

function AdminSurveysConfigPage({ onNavigate }: AdminSurveysConfigPageProps) {
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
        <AdminCenterSidebar activeMenu="configSurveys" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Config &gt; Surveys</h1>
                <p>Manage admin-side settings for the employee portal Surveys module.</p>
              </div>
            </div>

            <div className="admin-config-action-list">
              <button
                className="admin-primary-btn"
                onClick={(event) => handleNavigate(ROUTES.adminConfigSurveyTemplates, event)}
              >
                Survey Templates
              </button>
              <button
                className="admin-secondary-btn"
                onClick={(event) => handleNavigate(ROUTES.adminConfigSurveyQuestionSets, event)}
              >
                Survey Question Sets
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default AdminSurveysConfigPage;
