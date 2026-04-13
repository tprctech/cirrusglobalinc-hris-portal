import {
  Award,
  BarChart2,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  MessageSquare,
  Network,
  Settings,
  Target,
  ListTodo,
  Users,
} from 'lucide-react';
import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import { ROUTES } from '../app/routes';

type AdminMenu = (
  | 'users'
  | 'lms'
  | 'companyResources'
  | 'libraryRole'
  | 'libraryDepartment'
  | 'libraryCompetency'
  | 'configOrgChart'
  | 'configKpi'
  | 'configTasks'
  | 'configReviews'
  | 'configSurveys'
  | 'configFeedback'
  | 'configRecognitions'
  | 'reportingReviews'
  | 'reportingSurveys'
);

const LIBRARY_MENUS: AdminMenu[] = ['libraryRole', 'libraryDepartment', 'libraryCompetency', 'companyResources'];
const REPORTING_MENUS: AdminMenu[] = ['reportingReviews', 'reportingSurveys'];

type AdminCenterSidebarProps = {
  activeMenu: AdminMenu;
  onNavigate: (path: string) => void;
};

function AdminCenterSidebar({ activeMenu, onNavigate }: AdminCenterSidebarProps) {
  const [libraryExpanded, setLibraryExpanded] = useState(
    LIBRARY_MENUS.includes(activeMenu),
  );
  const [configExpanded, setConfigExpanded] = useState(
    activeMenu === 'configOrgChart'
    || activeMenu === 'configKpi'
    || activeMenu === 'configTasks'
    || activeMenu === 'configReviews'
    || activeMenu === 'configSurveys'
    || activeMenu === 'configFeedback'
    || activeMenu === 'configRecognitions',
  );
  const [reportingExpanded, setReportingExpanded] = useState(
    REPORTING_MENUS.includes(activeMenu),
  );

  const isLibraryMenuActive = LIBRARY_MENUS.includes(activeMenu);
  const isConfigMenuActive = (
    activeMenu === 'configOrgChart'
    || activeMenu === 'configKpi'
    || activeMenu === 'configTasks'
    || activeMenu === 'configReviews'
    || activeMenu === 'configSurveys'
    || activeMenu === 'configFeedback'
    || activeMenu === 'configRecognitions'
  );
  const isReportingMenuActive = REPORTING_MENUS.includes(activeMenu);

  function handleNavigate(path: string, event: ReactMouseEvent<HTMLButtonElement>) {
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      event.preventDefault();
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(path);
  }

  return (
    <nav className="admin-center-sidebar">
      <h2>HR Center</h2>
      <button
        className={`admin-center-side-link ${activeMenu === 'users' ? 'active' : ''}`}
        onClick={(event) => handleNavigate(ROUTES.adminUsers, event)}
      >
        <Users size={16} />
        <span>Users</span>
      </button>
      <button
        className={`admin-center-side-link ${activeMenu === 'lms' ? 'active' : ''}`}
        onClick={(event) => handleNavigate(ROUTES.adminLms, event)}
      >
        <BookOpenText size={16} />
        <span>L&amp;D</span>
      </button>
      <button
        className={`admin-center-side-link ${isLibraryMenuActive ? 'active' : ''}`}
        onClick={() => setLibraryExpanded((previous) => !previous)}
      >
        <FolderOpen size={16} />
        <span>Library</span>
        <span className="admin-center-accordion-chevron">
          {libraryExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {libraryExpanded && (
        <div className="admin-center-submenu">
          <button
            className={`admin-center-sub-link ${activeMenu === 'libraryDepartment' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminLibraryDepartment, event)}
          >
            <FolderOpen size={14} />
            <span>Department</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'libraryCompetency' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminCompetencyLib, event)}
          >
            <BookOpenText size={14} />
            <span>Competency</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'libraryRole' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminLibraryRole, event)}
          >
            <Users size={14} />
            <span>Role</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'companyResources' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminCompanyResources, event)}
          >
            <FileText size={14} />
            <span>Company Resources</span>
          </button>
        </div>
      )}

      <button
        className={`admin-center-side-link ${isConfigMenuActive ? 'active' : ''}`}
        onClick={() => setConfigExpanded((previous) => !previous)}
      >
        <Settings size={16} />
        <span>Configuration</span>
        <span className="admin-center-accordion-chevron">
          {configExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {configExpanded && (
        <div className="admin-center-submenu">
          <button
            className={`admin-center-sub-link ${activeMenu === 'configOrgChart' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigOrgChart, event)}
          >
            <Network size={14} />
            <span>Organization Chart</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'configKpi' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigKpi, event)}
          >
            <Target size={14} />
            <span>KPI</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'configTasks' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigTasks, event)}
          >
            <ListTodo size={14} />
            <span>Tasks</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'configReviews' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigReviews, event)}
          >
            <ClipboardList size={14} />
            <span>Reviews</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'configSurveys' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigSurveys, event)}
          >
            <BarChart2 size={14} />
            <span>Surveys</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'configFeedback' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigFeedback, event)}
          >
            <MessageSquare size={14} />
            <span>Feedback</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'configRecognitions' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminConfigRecognitions, event)}
          >
            <Award size={14} />
            <span>Recognitions</span>
          </button>
        </div>
      )}

      <button
        className={`admin-center-side-link ${isReportingMenuActive ? 'active' : ''}`}
        onClick={() => setReportingExpanded((previous) => !previous)}
      >
        <BarChart2 size={16} />
        <span>Reporting</span>
        <span className="admin-center-accordion-chevron">
          {reportingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {reportingExpanded && (
        <div className="admin-center-submenu">
          <button
            className={`admin-center-sub-link ${activeMenu === 'reportingReviews' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminReportingReviews, event)}
          >
            <ClipboardList size={14} />
            <span>Reviews</span>
          </button>
          <button
            className={`admin-center-sub-link ${activeMenu === 'reportingSurveys' ? 'active' : ''}`}
            onClick={(event) => handleNavigate(ROUTES.adminReportingSurveys, event)}
          >
            <BarChart2 size={14} />
            <span>Surveys</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default AdminCenterSidebar;
