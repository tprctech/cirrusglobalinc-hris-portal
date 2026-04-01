import AdminCenterSidebar from '../../components/AdminCenterSidebar';
import './AdminCenterPage.css';

type ConfigMenu = (
  | 'configOrgChart'
  | 'configKpi'
  | 'configTasks'
  | 'configReviews'
  | 'configSurveys'
  | 'configFeedback'
  | 'configRecognitions'
);

type AdminPortalConfigPageProps = {
  title: string;
  description: string;
  activeMenu: ConfigMenu;
  onNavigate?: (path: string) => void;
};

function AdminPortalConfigPage({
  title,
  description,
  activeMenu,
  onNavigate,
}: AdminPortalConfigPageProps) {
  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu={activeMenu} onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Configuration &gt; {title}</h1>
                <p>{description}</p>
              </div>
            </div>

            <div className="admin-learning-material-list">
              <p>
                This page is reserved for admin configuration of the employee portal&apos;s {title} module.
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default AdminPortalConfigPage;

