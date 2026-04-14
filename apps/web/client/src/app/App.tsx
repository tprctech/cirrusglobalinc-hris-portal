import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import './App.css';
import {
  Award,
  BarChart2,
  Bell,
  BookOpen,
  Briefcase,
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
import OnboardingPage from '../pages/employee-portal/OnboardingPage';
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
import AdminFeedbackConfigPage from '../pages/admin-center/config/AdminFeedbackConfigPage';
import AdminPortalConfigPage from '../pages/admin-center/AdminPortalConfigPage';
import AdminReviewsConfigPage from '../pages/admin-center/config/reviews/AdminReviewsConfigPage';
import AdminSurveysConfigPage from '../pages/admin-center/config/surveys/AdminSurveysConfigPage';
import AdminRecognitionsConfigPage from '../pages/admin-center/config/recognitions/AdminRecognitionsConfigPage';
import AdminOrgChartConfigPage from '../pages/admin-center/config/AdminOrgChartConfigPage';
import AdminCompanyResourcesPage from '../pages/admin-center/AdminCompanyResourcesPage';
import AdminReportingReviewsPage from '../pages/admin-center/reporting/AdminReportingReviewsPage';
import AdminReportingSurveysPage from '../pages/admin-center/reporting/AdminReportingSurveysPage';
import AdminReportingVoePage from '../pages/admin-center/reporting/AdminReportingVoePage';
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

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string | null;
}

function formatTimeAgo(isoDate: string | null): string {
  if (!isoDate) return '';
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function App() {
  const { user, loading, logout, hasRole, token } = useAuth();
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname));
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    function fetchNotifications() {
      fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: NotificationItem[]) => {
          if (!cancelled) setNotifications(data);
        })
        .catch(() => {});
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

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
    if (!token) return;
    fetch('/api/v1/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function handleNotificationClick(n: NotificationItem) {
    if (!n.is_read && token) {
      fetch(`/api/v1/notifications/${n.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
    }
    if (n.link) {
      navigateTo(n.link);
    }
    setNotificationsOpen(false);
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

  type SidebarItem = {
    label: string;
    icon: ReactNode;
    children?: { label: string; icon: ReactNode }[];
  };

  const sidebarItems: SidebarItem[] = [
    { label: 'Home', icon: <Home size={20} /> },
    { label: 'Onboarding', icon: <ClipboardList size={20} /> },
    { label: 'KPI', icon: <Target size={20} /> },
    { label: 'L&D', icon: <GraduationCap size={20} /> },
    { label: 'Tasks', icon: <ListTodo size={20} /> },
    {
      label: 'Talent Management',
      icon: <Briefcase size={20} />,
      children: [
        { label: 'Performance Reviews', icon: <ClipboardList size={18} /> },
        { label: 'Feedback', icon: <MessageSquare size={18} /> },
        { label: 'AI Surveys', icon: <BarChart2 size={18} /> },
        { label: 'Recognitions', icon: <Award size={18} /> },
      ],
    },
    { label: 'Organization Chart', icon: <Network size={20} /> },
  ];

  const talentChildLabels = ['Performance Reviews', 'Feedback', 'AI Surveys', 'Recognitions'];

  const [talentExpanded, setTalentExpanded] = useState(() => {
    const label = getMenuLabelForPath(currentPath);
    return label !== null && talentChildLabels.includes(label);
  });

  useEffect(() => {
    const label = getMenuLabelForPath(currentPath);
    if (label !== null && talentChildLabels.includes(label)) {
      setTalentExpanded(true);
    }
  }, [currentPath]);

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
              HCM Center
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
                  {notifications.length === 0 && (
                    <div className="notification-empty">No notifications yet</div>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.is_read ? '' : 'unread'}${n.link ? ' clickable' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="notification-item-dot">{!n.is_read && <span />}</div>
                      <div className="notification-item-content">
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-message">{n.message}</div>
                        <div className="notification-item-time">{formatTimeAgo(n.created_at)}</div>
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
              {sidebarItems.map((item) => {
                if (item.children) {
                  const talentChildLabels = item.children.map((c) => c.label);
                  const isChildActive = activeMenuLabel !== null && talentChildLabels.includes(activeMenuLabel);
                  const isOpen = talentExpanded;

                  if (sidebarCollapsed) {
                    return item.children.map((child) => (
                      <button
                        key={child.label}
                        className={`sidebar-link ${activeMenuLabel === child.label ? 'active' : ''}`}
                        onClick={(event) => {
                          const route = MENU_ROUTE_MAP[child.label as MenuLabel];
                          if (currentPath !== route || shouldOpenInNewTab(event)) {
                            navigateTo(route, event);
                          }
                        }}
                        title={child.label}
                      >
                        <span className="sidebar-link-icon">{child.icon}</span>
                      </button>
                    ));
                  }

                  return (
                    <div key={item.label} className="sidebar-accordion">
                      <button
                        className={`sidebar-link sidebar-accordion-trigger ${isChildActive ? 'active-parent' : ''}`}
                        onClick={() => setTalentExpanded(!isOpen)}
                      >
                        <span className="sidebar-link-icon">{item.icon}</span>
                        <span className="sidebar-link-label">{item.label}</span>
                        <ChevronDown
                          size={14}
                          className={`sidebar-accordion-chevron ${isOpen ? 'open' : ''}`}
                        />
                      </button>
                      <div className={`sidebar-accordion-children ${isOpen ? 'expanded' : ''}`}>
                        <div className="sidebar-accordion-inner">
                          {item.children.map((child) => (
                            <button
                              key={child.label}
                              className={`sidebar-link sidebar-child-link ${activeMenuLabel === child.label ? 'active' : ''}`}
                              onClick={(event) => {
                                const route = MENU_ROUTE_MAP[child.label as MenuLabel];
                                if (currentPath !== route || shouldOpenInNewTab(event)) {
                                  navigateTo(route, event);
                                }
                              }}
                            >
                              <span className="sidebar-link-icon">{child.icon}</span>
                              <span className="sidebar-link-label">{child.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
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
                );
              })}
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
          {currentPath === ROUTES.onboarding && <OnboardingPage />}
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
            <AdminOrgChartConfigPage onNavigate={navigateTo} />
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
            <AdminFeedbackConfigPage onNavigate={navigateTo} />
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
          {currentPath === ROUTES.adminReportingReviews && (
            <AdminReportingReviewsPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminReportingSurveys && (
            <AdminReportingSurveysPage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.adminReportingVoe && (
            <AdminReportingVoePage onNavigate={navigateTo} />
          )}
          {currentPath === ROUTES.profile && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

export default App;

