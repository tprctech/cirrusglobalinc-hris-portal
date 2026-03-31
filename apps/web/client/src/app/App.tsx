import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import './App.css';
import {
  Award,
  BarChart2,
  BookOpen,
  Building,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Phone,
  Settings,
  Target,
  ListTodo,
  User,
  GraduationCap,
} from 'lucide-react';
import { currentUser } from '../data/mock/homeMockData';
import HomePage from '../pages/employee-portal/HomePage';
import ProfilePage from '../pages/employee-portal/ProfilePage';
import KpiPage from '../pages/employee-portal/KpiPage';
import TasksPage from '../pages/employee-portal/TasksPage';
import ReviewsPage from '../pages/employee-portal/ReviewsPage';
import SurveysPage from '../pages/employee-portal/SurveysPage';
import FeedbackPage from '../pages/employee-portal/FeedbackPage';
import RecognitionsPage from '../pages/employee-portal/RecognitionsPage';
import OrgChartPage from '../pages/employee-portal/OrgChartPage';
import LearningDevelopmentPage from '../pages/employee-portal/LearningDevelopmentPage';
import LmsHomePage from '../pages/lms/LmsHomePage';
import LmsMyCoursesPage from '../pages/lms/LmsMyCoursesPage';
import LmsExploreCoursesPage from '../pages/lms/LmsExploreCoursesPage';
import AdminUsersPage from '../pages/admin-center/AdminUsersPage';
import AdminLmsCoursesPage from '../pages/admin-center/AdminLmsCoursesPage';
import AdminCompetencyLibraryPage from '../pages/admin-center/library/AdminCompetencyLibraryPage';
import AdminRoleLibraryPage from '../pages/admin-center/library/AdminRoleLibraryPage';
import AdminPortalConfigPage from '../pages/admin-center/AdminPortalConfigPage';
import AdminReviewsConfigPage from '../pages/admin-center/config/reviews/AdminReviewsConfigPage';
import AdminReviewTemplatesPage from '../pages/admin-center/config/reviews/AdminReviewTemplatesPage';
import AdminReviewQuestionSetsPage from '../pages/admin-center/config/reviews/AdminReviewQuestionSetsPage';
import AdminSurveysConfigPage from '../pages/admin-center/config/surveys/AdminSurveysConfigPage';
import AdminSurveyTemplatesPage from '../pages/admin-center/config/surveys/AdminSurveyTemplatesPage';
import AdminSurveyQuestionSetsPage from '../pages/admin-center/config/surveys/AdminSurveyQuestionSetsPage';
import AdminRecognitionsConfigPage from '../pages/admin-center/config/recognitions/AdminRecognitionsConfigPage';
import AdminRecognitionBadgesPage from '../pages/admin-center/config/recognitions/AdminRecognitionBadgesPage';
import AdminManageRewardsPage from '../pages/admin-center/config/recognitions/AdminManageRewardsPage';
import AdminManageRewardRedeemsPage from '../pages/admin-center/config/recognitions/AdminManageRewardRedeemsPage';
import {
  LMS_MENU_ROUTE_MAP,
  MENU_ROUTE_MAP,
  ROUTES,
  type LmsMenuLabel,
  type MenuLabel,
} from './routes';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function normalizePath(pathname: string) {
  if (pathname === ROUTES.admin) {
    return ROUTES.adminUsers;
  }
  if (pathname === '/library' || pathname === '/admin/library') {
    return ROUTES.adminLibraryRole;
  }
  if (pathname === '/library/role') {
    return ROUTES.adminLibraryRole;
  }
  if (pathname === '/library/competency') {
    return ROUTES.adminCompetencyLib;
  }
  if (pathname === '/admin/competency-lib') {
    return ROUTES.adminCompetencyLib;
  }
  if (pathname === '/admin/config') {
    return ROUTES.adminConfigOrgChart;
  }
  if (pathname === '/lms') {
    return ROUTES.lmsHome;
  }

  const validRoutes = Object.values(ROUTES);
  if (validRoutes.includes(pathname as (typeof ROUTES)[keyof typeof ROUTES])) {
    return pathname;
  }
  return ROUTES.home;
}

function getMenuLabelForPath(pathname: string): MenuLabel | null {
  const routeEntries = Object.entries(MENU_ROUTE_MAP) as Array<[MenuLabel, string]>;
  const match = routeEntries.find(([, route]) => route === pathname);
  return match ? match[0] : null;
}

function getLmsMenuLabelForPath(pathname: string): LmsMenuLabel | null {
  const routeEntries = Object.entries(LMS_MENU_ROUTE_MAP) as Array<[LmsMenuLabel, string]>;
  const match = routeEntries.find(([, route]) => route === pathname);
  return match ? match[0] : null;
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname));
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (window.location.pathname !== normalized) {
      window.history.replaceState({}, '', normalized);
    }
    setCurrentPath(normalized);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handlePopState() {
      const normalized = normalizePath(window.location.pathname);
      if (window.location.pathname !== normalized) {
        window.history.replaceState({}, '', normalized);
      }
      setCurrentPath(normalized);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function shouldOpenInNewTab(event?: ReactMouseEvent<HTMLElement>) {
    return Boolean(event && (event.ctrlKey || event.metaKey || event.button === 1));
  }

  function navigateTo(path: string, event?: ReactMouseEvent<HTMLElement>) {
    const normalized = normalizePath(path);
    if (shouldOpenInNewTab(event)) {
      window.open(normalized, '_blank', 'noopener,noreferrer');
      return;
    }

    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setCurrentPath(normalized);
  }

  function openProfilePage() {
    setProfileOpen(false);
    navigateTo(ROUTES.profile);
  }

  function goToEmployeePortal() {
    setProfileOpen(false);
    navigateTo(ROUTES.home);
  }

  const sidebarItems = [
    { label: 'Home', icon: <Home size={20} /> },
    { label: 'L&D', icon: <GraduationCap size={20} /> },
    { label: 'Org Chart', icon: <Network size={20} /> },
    { label: 'KPI', icon: <Target size={20} /> },
    { label: 'Tasks', icon: <ListTodo size={20} /> },
    { label: 'Reviews', icon: <ClipboardList size={20} /> },
    { label: 'Surveys', icon: <BarChart2 size={20} /> },
    { label: 'Feedback', icon: <MessageSquare size={20} /> },
    { label: 'Recognitions', icon: <Award size={20} /> },
  ];
  const activeMenuLabel = getMenuLabelForPath(currentPath);
  const activeLmsMenuLabel = getLmsMenuLabelForPath(currentPath);
  const isAdminCenter = currentPath.startsWith('/admin');
  const isLmsCenter = currentPath.startsWith('/lms');

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/cirrus-logo.webp" alt="Cirrus HRIS" className="navbar-logo" />
        </div>

        <div className="navbar-right">
          {!isAdminCenter && !isLmsCenter && (
            <button
              className={`admin-btn ${isAdminCenter ? 'active' : ''}`}
              onClick={(event) => navigateTo(ROUTES.adminUsers, event)}
            >
              <Settings size={14} />
              Admin Center
            </button>
          )}
          <div className="profile-wrapper" ref={profileRef}>
            <div
              className="user-info"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="user-avatar">{getInitials(currentUser.name)}</div>
              <div className="user-details">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{currentUser.role}</span>
              </div>
              <ChevronDown size={14} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
            </div>

            {profileOpen && (
              <div className="profile-popup">
                <div className="profile-popup-header">
                  <div className="profile-popup-avatar">
                    {getInitials(currentUser.name)}
                  </div>
                  <div>
                    <div className="profile-popup-name">{currentUser.name}</div>
                    <div className="profile-popup-role">{currentUser.role}</div>
                  </div>
                </div>
                <div className="profile-popup-divider" />
                <div className="profile-popup-details">
                  <div className="profile-detail-item">
                    <Mail size={14} />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="profile-detail-item">
                    <Building size={14} />
                    <span>{currentUser.department}</span>
                  </div>
                  <div className="profile-detail-item">
                    <MapPin size={14} />
                    <span>{currentUser.location}</span>
                  </div>
                  <div className="profile-detail-item">
                    <Phone size={14} />
                    <span>{currentUser.phone}</span>
                  </div>
                  <div className="profile-detail-item">
                    <Calendar size={14} />
                    <span>Joined {currentUser.hireDate}</span>
                  </div>
                </div>
                <div className="profile-popup-divider" />
                <button className="profile-popup-link" onClick={openProfilePage}>
                  <User size={14} />
                  View Full Profile
                </button>
                {!isLmsCenter && (
                  <button className="profile-popup-link" onClick={() => navigateTo(ROUTES.lmsHome)}>
                    <BookOpen size={14} />
                    My LMS
                  </button>
                )}
                {(isAdminCenter || isLmsCenter) && (
                  <button className="profile-popup-link" onClick={goToEmployeePortal}>
                    <Home size={14} />
                    Employee Portal
                  </button>
                )}
                <button className="profile-popup-logout">
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="layout">
        {!isAdminCenter && !isLmsCenter && (
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-nav">
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  className={`sidebar-link ${activeMenuLabel === item.label ? 'active' : ''}`}
                  onClick={(event) => {
                    const route = MENU_ROUTE_MAP[item.label as MenuLabel];
                    if (currentPath !== route || shouldOpenInNewTab(event)) {
                      navigateTo(route, event);
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {!sidebarCollapsed && <span className="sidebar-link-label">{item.label}</span>}
                </button>
              ))}
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </aside>
        )}

        {isLmsCenter && (
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-nav">
              {[
                { label: 'Home', icon: <Home size={20} /> },
                { label: 'My Courses', icon: <ClipboardList size={20} /> },
                { label: 'Explore Courses', icon: <BookOpen size={20} /> },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`sidebar-link ${activeLmsMenuLabel === item.label ? 'active' : ''}`}
                  onClick={(event) => {
                    const route = LMS_MENU_ROUTE_MAP[item.label as LmsMenuLabel];
                    if (currentPath !== route || shouldOpenInNewTab(event)) {
                      navigateTo(route, event);
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {!sidebarCollapsed && <span className="sidebar-link-label">{item.label}</span>}
                </button>
              ))}
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </aside>
        )}

        <main className={`main-content ${isAdminCenter ? 'admin-main-content' : ''}`}>
          {currentPath === ROUTES.home && <HomePage />}
          {currentPath === ROUTES.orgChart && <OrgChartPage />}
          {currentPath === ROUTES.kpi && <KpiPage />}
          {currentPath === ROUTES.tasks && <TasksPage />}
          {currentPath === ROUTES.reviews && <ReviewsPage />}
          {currentPath === ROUTES.surveys && <SurveysPage />}
          {currentPath === ROUTES.feedback && <FeedbackPage />}
          {currentPath === ROUTES.recognitions && <RecognitionsPage />}
          {currentPath === ROUTES.learningDevelopment && <LearningDevelopmentPage />}
          {currentPath === ROUTES.lmsHome && <LmsHomePage />}
          {currentPath === ROUTES.lmsMyCourses && <LmsMyCoursesPage />}
          {currentPath === ROUTES.lmsExploreCourses && <LmsExploreCoursesPage />}
          {currentPath === ROUTES.adminUsers && <AdminUsersPage onNavigate={navigateTo} />}
          {currentPath === ROUTES.adminLms && <AdminLmsCoursesPage onNavigate={navigateTo} />}
          {currentPath === ROUTES.adminLibraryRole && <AdminRoleLibraryPage onNavigate={navigateTo} />}
          {currentPath === ROUTES.adminCompetencyLib && (
            <AdminCompetencyLibraryPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigOrgChart && (
            <AdminPortalConfigPage
              activeMenu="configOrgChart"
              title="Org Chart"
              description="Manage admin-side settings for the employee portal Org Chart."
              onNavigate={navigateTo}
            />
          )}
          {currentPath === ROUTES.adminConfigKpi && (
            <AdminPortalConfigPage
              activeMenu="configKpi"
              title="KPI"
              description="Manage admin-side settings for the employee portal KPI module."
              onNavigate={navigateTo}
            />
          )}
          {currentPath === ROUTES.adminConfigTasks && (
            <AdminPortalConfigPage
              activeMenu="configTasks"
              title="Tasks"
              description="Manage admin-side settings for the employee portal Tasks module."
              onNavigate={navigateTo}
            />
          )}
          {currentPath === ROUTES.adminConfigReviews && (
            <AdminReviewsConfigPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigReviewTemplates && (
            <AdminReviewTemplatesPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigReviewQuestionSets && (
            <AdminReviewQuestionSetsPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigSurveys && (
            <AdminSurveysConfigPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigSurveyTemplates && (
            <AdminSurveyTemplatesPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigSurveyQuestionSets && (
            <AdminSurveyQuestionSetsPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigFeedback && (
            <AdminPortalConfigPage
              activeMenu="configFeedback"
              title="Feedback"
              description="Manage admin-side settings for the employee portal Feedback module."
              onNavigate={navigateTo}
            />
          )}
          {currentPath === ROUTES.adminConfigRecognitions && (
            <AdminRecognitionsConfigPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigRecognitionBadges && (
            <AdminRecognitionBadgesPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigManageRewards && (
            <AdminManageRewardsPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigManageRewardRedeems && (
            <AdminManageRewardRedeemsPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.profile && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

export default App;

