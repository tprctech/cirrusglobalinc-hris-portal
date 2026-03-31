export const ROUTES = {
  home: '/home',
  orgChart: '/org-chart',
  kpi: '/kpi',
  tasks: '/tasks',
  reviews: '/reviews',
  surveys: '/surveys',
  feedback: '/feedback',
  recognitions: '/recognitions',
  learningDevelopment: '/learning-development',
  lmsHome: '/lms/home',
  lmsMyCourses: '/lms/my-courses',
  lmsExploreCourses: '/lms/explore-courses',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminLms: '/admin/lms',
  adminLibraryRole: '/admin/library/role',
  adminCompetencyLib: '/admin/library/competency',
  adminConfigOrgChart: '/admin/config/org-chart',
  adminConfigKpi: '/admin/config/kpi',
  adminConfigTasks: '/admin/config/tasks',
  adminConfigReviews: '/admin/config/reviews',
  adminConfigReviewTemplates: '/admin/config/reviews/templates',
  adminConfigReviewQuestionSets: '/admin/config/reviews/questionsets',
  adminConfigSurveys: '/admin/config/surveys',
  adminConfigSurveyTemplates: '/admin/config/surveys/templates',
  adminConfigSurveyQuestionSets: '/admin/config/surveys/questionsets',
  adminConfigFeedback: '/admin/config/feedback',
  adminConfigRecognitions: '/admin/config/recognitions',
  adminConfigRecognitionBadges: '/admin/config/recognitions/badges',
  adminConfigManageRewards: '/admin/config/recognitions/rewards',
  adminConfigManageRewardRedeems: '/admin/config/recognitions/redeems',
  profile: '/profile',
} as const;

export const MENU_ROUTE_MAP = {
  Home: ROUTES.home,
  'Org Chart': ROUTES.orgChart,
  KPI: ROUTES.kpi,
  Tasks: ROUTES.tasks,
  Reviews: ROUTES.reviews,
  Surveys: ROUTES.surveys,
  Feedback: ROUTES.feedback,
  Recognitions: ROUTES.recognitions,
  'L&D': ROUTES.learningDevelopment,
} as const;

export const LMS_MENU_ROUTE_MAP = {
  Home: ROUTES.lmsHome,
  'My Courses': ROUTES.lmsMyCourses,
  'Explore Courses': ROUTES.lmsExploreCourses,
} as const;

export type MenuLabel = keyof typeof MENU_ROUTE_MAP;
export type LmsMenuLabel = keyof typeof LMS_MENU_ROUTE_MAP;
