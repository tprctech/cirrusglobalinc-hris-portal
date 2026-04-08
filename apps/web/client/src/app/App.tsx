import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import './App.css';
import {
  Award,
  BarChart2,
  Bell,
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
  Lock,
} from 'lucide-react';
import { changePassword } from '../api/auth';
import { useAuth } from './AuthContext';
import LoginPage from '../pages/LoginPage';
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
import AdminDepartmentLibraryPage from '../pages/admin-center/library/AdminDepartmentLibraryPage';
import AdminPortalConfigPage from '../pages/admin-center/AdminPortalConfigPage';
import AdminReviewsConfigPage from '../pages/admin-center/config/reviews/AdminReviewsConfigPage';
import AdminSurveysConfigPage from '../pages/admin-center/config/surveys/AdminSurveysConfigPage';
import AdminRecognitionsConfigPage from '../pages/admin-center/config/recognitions/AdminRecognitionsConfigPage';
import AdminCompanyResourcesPage from '../pages/admin-center/AdminCompanyResourcesPage';
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
    return ROUTES.adminLibraryDepartment;
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

const mockNotifications = [
  { id: '1', type: 'review', title: 'Performance Review Due', message: 'Your Q2 self-assessment is due in 3 days.', time: '2 hours ago', read: false },
  { id: '2', type: 'feedback', title: 'New Feedback Received', message: 'Sarah Johnson sent you feedback on your recent presentation.', time: '5 hours ago', read: false },
  { id: '3', type: 'recognition', title: 'You Were Recognized!', message: 'David Lee recognized you for "Outstanding Teamwork".', time: '1 day ago', read: false },
  { id: '4', type: 'survey', title: 'New Survey Available', message: 'Employee Engagement Survey Q2 is now open.', time: '1 day ago', read: true },
  { id: '5', type: 'kpi', title: 'KPI Update', message: 'Your monthly KPI targets have been updated by your manager.', time: '2 days ago', read: true },
  { id: '6', type: 'task', title: 'Task Assigned', message: 'Complete onboarding checklist for new team member.', time: '3 days ago', read: true },
];

function App() {
  const { user, loading, logout, hasRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [cpCurrentPwd, setCpCurrentPwd] = useState('');
  const [cpNewPwd, setCpNewPwd] = useState('');
  const [cpConfirmPwd, setCpConfirmPwd] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname));
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const canAccessAdmin = hasRole('HR', 'Admin');
  const emp = user?.employee;
  const displayName = emp?.displayName || (emp ? `${emp.firstName} ${emp.lastName}` : user?.email ?? '');
  const displayRole = emp?.jobTitle || user?.portalRole || '';
  const displayEmail = emp?.email || '';
  const displayDepartment = emp?.department || '';
  const displayLocation = emp?.officeLocation || '';
  const displayPhone = emp?.phone || '';
  const displayHireDate = emp?.dateHired || '';
  const displayPhoto = emp?.profilePhoto || '';

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
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
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

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function openProfilePage() {
    setProfileOpen(false);
    navigateTo(ROUTES.profile);
  }

  function goToEmployeePortal() {
    setProfileOpen(false);
    navigateTo(ROUTES.home);
  }

  function openChangePassword() {
    setProfileOpen(false);
    setCpCurrentPwd('');
    setCpNewPwd('');
    setCpConfirmPwd('');
    setCpError('');
    setCpSuccess('');
    setChangePasswordOpen(true);
  }

  async function handleChangePassword() {
    setCpError('');
    setCpSuccess('');
    if (!cpCurrentPwd || !cpNewPwd || !cpConfirmPwd) {
      setCpError('Please fill in all fields.');
      return;
    }
    if (cpNewPwd !== cpConfirmPwd) {
      setCpError('New passwords do not match.');
      return;
    }
    if (cpNewPwd.length < 6) {
      setCpError('New password must be at least 6 characters.');
      return;
    }
    setCpLoading(true);
    try {
      const result = await changePassword(cpCurrentPwd, cpNewPwd);
      setCpSuccess(result.message);
      setCpCurrentPwd('');
      setCpNewPwd('');
      setCpConfirmPwd('');
    } catch (err: unknown) {
      setCpError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setCpLoading(false);
    }
  }

  const sidebarItems = [
    { label: 'Home', icon: <Home size={20} /> },
    { label: 'KPI', icon: <Target size={20} /> },
    { label: 'L&D', icon: <GraduationCap size={20} /> },
    { label: 'Tasks', icon: <ListTodo size={20} /> },
    { label: 'Performance Reviews', icon: <ClipboardList size={20} /> },
    { label: 'Feedback', icon: <MessageSquare size={20} /> },
    { label: 'AI Surveys', icon: <BarChart2 size={20} /> },
    { label: 'Recognitions', icon: <Award size={20} /> },
    { label: 'Organization Chart', icon: <Network size={20} /> },
  ];
  const activeMenuLabel = getMenuLabelForPath(currentPath);
  const activeLmsMenuLabel = getLmsMenuLabelForPath(currentPath);
  const isAdminCenter = currentPath.startsWith('/admin');
  const isLmsCenter = currentPath.startsWith('/lms');

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (isAdminCenter && !canAccessAdmin) {
    navigateTo(ROUTES.home);
    return null;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/cirrus-logo.webp" alt="Cirrus HRIS" className="navbar-logo" />
        </div>

        <div className="navbar-right">
          {!isAdminCenter && !isLmsCenter && canAccessAdmin && (
            <button
              className={`admin-btn ${isAdminCenter ? 'active' : ''}`}
              onClick={(event) => navigateTo(ROUTES.adminUsers, event)}
            >
              <Settings size={14} />
              HR Center
            </button>
          )}
          <div className="notification-wrapper" ref={notificationRef}>
            <button
              className="notification-bell"
              title="Notifications"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {notificationsOpen && (
              <div className="notification-popup">
                <div className="notification-popup-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="notification-mark-read" onClick={markAllNotificationsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notification-popup-list">
                  {notifications.map((n) => (
                    <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
                      <div className="notification-item-dot">{!n.read && <span />}</div>
                      <div className="notification-item-content">
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-message">{n.message}</div>
                        <div className="notification-item-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="profile-wrapper" ref={profileRef}>
            <div
              className="user-info"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {displayPhoto ? (
                <img src={displayPhoto} alt={displayName} className="user-avatar-img" />
              ) : (
                <div className="user-avatar">{getInitials(displayName)}</div>
              )}
              <div className="user-details">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{displayRole}</span>
              </div>
              <ChevronDown size={14} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
            </div>

            {profileOpen && (
              <div className="profile-popup">
                <div className="profile-popup-header">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={displayName} className="profile-popup-avatar-img" />
                  ) : (
                    <div className="profile-popup-avatar">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <div>
                    <div className="profile-popup-name">{displayName}</div>
                    <div className="profile-popup-role">{displayRole}</div>
                  </div>
                </div>
                <div className="profile-popup-divider" />
                <div className="profile-popup-details">
                  {displayEmail && (
                    <div className="profile-detail-item">
                      <Mail size={14} />
                      <span>{displayEmail}</span>
                    </div>
                  )}
                  {displayDepartment && (
                    <div className="profile-detail-item">
                      <Building size={14} />
                      <span>{displayDepartment}</span>
                    </div>
                  )}
                  {displayLocation && (
                    <div className="profile-detail-item">
                      <MapPin size={14} />
                      <span>{displayLocation}</span>
                    </div>
                  )}
                  {displayPhone && (
                    <div className="profile-detail-item">
                      <Phone size={14} />
                      <span>{displayPhone}</span>
                    </div>
                  )}
                  {displayHireDate && (
                    <div className="profile-detail-item">
                      <Calendar size={14} />
                      <span>Joined {displayHireDate}</span>
                    </div>
                  )}
                </div>
                <div className="profile-popup-divider" />
                <button className="profile-popup-link" onClick={openProfilePage}>
                  <User size={14} />
                  View Full Profile
                </button>
                {(isAdminCenter || isLmsCenter) && (
                  <button className="profile-popup-link" onClick={goToEmployeePortal}>
                    <Home size={14} />
                    Employee Portal
                  </button>
                )}
                <button className="profile-popup-link" onClick={openChangePassword}>
                  <Lock size={14} />
                  Change Password
                </button>
                <button className="profile-popup-logout" onClick={() => { setProfileOpen(false); logout(); }}>
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {changePasswordOpen && (
        <div className="app-modal-backdrop" onClick={() => setChangePasswordOpen(false)}>
          <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            {cpError && <div className="change-password-error">{cpError}</div>}
            {cpSuccess && <div className="change-password-success">{cpSuccess}</div>}
            {!cpSuccess && (
              <>
                <div className="change-password-field">
                  <label>Current Password</label>
                  <input type="password" value={cpCurrentPwd} onChange={(e) => setCpCurrentPwd(e.target.value)} placeholder="Enter current password" />
                </div>
                <div className="change-password-field">
                  <label>New Password</label>
                  <input type="password" value={cpNewPwd} onChange={(e) => setCpNewPwd(e.target.value)} placeholder="Enter new password" />
                </div>
                <div className="change-password-field">
                  <label>Confirm New Password</label>
                  <input type="password" value={cpConfirmPwd} onChange={(e) => setCpConfirmPwd(e.target.value)} placeholder="Confirm new password" />
                </div>
                <div className="change-password-actions">
                  <button className="change-password-cancel" onClick={() => setChangePasswordOpen(false)}>Cancel</button>
                  <button className="change-password-submit" onClick={handleChangePassword} disabled={cpLoading}>
                    {cpLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </>
            )}
            {cpSuccess && (
              <div className="change-password-actions">
                <button className="change-password-submit" onClick={() => setChangePasswordOpen(false)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

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
          {currentPath === ROUTES.adminLibraryDepartment && <AdminDepartmentLibraryPage onNavigate={navigateTo} />}
          {currentPath === ROUTES.adminCompetencyLib && (
            <AdminCompetencyLibraryPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigOrgChart && (
            <AdminPortalConfigPage
              activeMenu="configOrgChart"
              title="Organization Chart"
              description="Manage admin-side settings for the employee portal Organization Chart."
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
          {(currentPath === ROUTES.adminConfigReviews
            || currentPath === ROUTES.adminConfigReviewTemplates
            || currentPath === ROUTES.adminConfigReviewQuestionSets) && (
            <AdminReviewsConfigPage onNavigate={navigateTo} />
          )}
          {(currentPath === ROUTES.adminConfigSurveys
            || currentPath === ROUTES.adminConfigSurveyTemplates
            || currentPath === ROUTES.adminConfigSurveyQuestionSets) && (
            <AdminSurveysConfigPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminConfigFeedback && (
            <AdminPortalConfigPage
              activeMenu="configFeedback"
              title="Feedback"
              description="Manage admin-side settings for the employee portal Feedback module."
              onNavigate={navigateTo}
            />
          )}
          {(currentPath === ROUTES.adminConfigRecognitions
            || currentPath === ROUTES.adminConfigRecognitionBadges
            || currentPath === ROUTES.adminConfigManageRewards
            || currentPath === ROUTES.adminConfigManageRewardRedeems) && (
            <AdminRecognitionsConfigPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminCompanyResources && (
            <AdminCompanyResourcesPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.profile && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

export default App;

