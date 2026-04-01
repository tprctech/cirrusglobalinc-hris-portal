import { adminMockData } from './adminMockData';

export type LearningMaterialType = 'Course' | 'Workshop' | 'Module';
export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type TrainingCalendarCategory = 'Competency' | 'IDP' | 'Cross-Training' | 'Leadership Essentials';

export type TrainingCalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: TrainingCalendarCategory;
  instructor: string;
  location: string;
  description: string;
};

export const trainingCalendarEvents: TrainingCalendarEvent[] = [
  {
    id: 'tc-1',
    title: 'Effective Communication Skills',
    date: '2026-04-02',
    startTime: '09:00',
    endTime: '11:00',
    category: 'Competency',
    instructor: 'Sarah Johnson',
    location: 'Virtual - MS Teams',
    description: 'Build core verbal and written communication competencies for workplace effectiveness.',
  },
  {
    id: 'tc-2',
    title: 'Leadership Foundations',
    date: '2026-04-04',
    startTime: '13:00',
    endTime: '15:30',
    category: 'Leadership Essentials',
    instructor: 'Alex Morgan',
    location: 'Conference Room A',
    description: 'Essential leadership principles for emerging leaders and team leads.',
  },
  {
    id: 'tc-3',
    title: 'Data Analytics for Non-Technical Roles',
    date: '2026-04-07',
    startTime: '10:00',
    endTime: '12:00',
    category: 'Cross-Training',
    instructor: 'Noah Patel',
    location: 'Virtual - Zoom',
    description: 'Cross-training session on interpreting data dashboards and making data-driven decisions.',
  },
  {
    id: 'tc-4',
    title: 'Individual Development Plan Workshop',
    date: '2026-04-09',
    startTime: '14:00',
    endTime: '16:00',
    category: 'IDP',
    instructor: 'Grace Walker',
    location: 'Training Room B',
    description: 'Hands-on workshop to build and refine your personal IDP goals and action steps.',
  },
  {
    id: 'tc-5',
    title: 'Project Management Fundamentals',
    date: '2026-04-11',
    startTime: '09:30',
    endTime: '11:30',
    category: 'Competency',
    instructor: 'David Lee',
    location: 'Virtual - MS Teams',
    description: 'Core competency training on project planning, execution, and stakeholder management.',
  },
  {
    id: 'tc-6',
    title: 'Coaching & Mentoring Skills',
    date: '2026-04-14',
    startTime: '13:00',
    endTime: '15:00',
    category: 'Leadership Essentials',
    instructor: 'Michael Chen',
    location: 'Conference Room B',
    description: 'Learn coaching frameworks and mentoring best practices for people managers.',
  },
  {
    id: 'tc-7',
    title: 'Marketing Fundamentals for Engineers',
    date: '2026-04-16',
    startTime: '10:00',
    endTime: '12:00',
    category: 'Cross-Training',
    instructor: 'Lisa Wang',
    location: 'Virtual - Zoom',
    description: 'Cross-functional training: understand marketing strategies, branding, and go-to-market planning.',
  },
  {
    id: 'tc-8',
    title: 'Career Pathing & Goal Setting',
    date: '2026-04-18',
    startTime: '14:00',
    endTime: '15:30',
    category: 'IDP',
    instructor: 'Grace Walker',
    location: 'Training Room A',
    description: 'IDP-focused session on aligning career goals with organizational growth opportunities.',
  },
  {
    id: 'tc-9',
    title: 'Conflict Resolution & Negotiation',
    date: '2026-04-21',
    startTime: '09:00',
    endTime: '11:00',
    category: 'Competency',
    instructor: 'Sarah Johnson',
    location: 'Virtual - MS Teams',
    description: 'Build competency in managing conflicts and negotiating win-win outcomes.',
  },
  {
    id: 'tc-10',
    title: 'Strategic Thinking for Leaders',
    date: '2026-04-23',
    startTime: '13:00',
    endTime: '15:00',
    category: 'Leadership Essentials',
    instructor: 'Alex Morgan',
    location: 'Conference Room A',
    description: 'Develop strategic planning and critical thinking skills for leadership roles.',
  },
  {
    id: 'tc-11',
    title: 'Finance Basics for Non-Finance Teams',
    date: '2026-04-25',
    startTime: '10:00',
    endTime: '12:00',
    category: 'Cross-Training',
    instructor: 'Amelia Stone',
    location: 'Virtual - Zoom',
    description: 'Cross-training on reading financial statements, budgeting, and cost management.',
  },
  {
    id: 'tc-12',
    title: 'IDP Mid-Cycle Review',
    date: '2026-04-28',
    startTime: '14:00',
    endTime: '16:00',
    category: 'IDP',
    instructor: 'Michael Chen',
    location: 'Training Room B',
    description: 'Review and recalibrate your IDP progress, adjust goals, and plan next steps.',
  },
  {
    id: 'tc-13',
    title: 'Presentation & Public Speaking',
    date: '2026-04-30',
    startTime: '09:00',
    endTime: '11:30',
    category: 'Competency',
    instructor: 'Lisa Wang',
    location: 'Conference Room A',
    description: 'Competency training on structuring presentations and delivering with confidence.',
  },
  {
    id: 'tc-14',
    title: 'Emotional Intelligence Workshop',
    date: '2026-05-02',
    startTime: '13:00',
    endTime: '15:00',
    category: 'Leadership Essentials',
    instructor: 'Sarah Johnson',
    location: 'Virtual - MS Teams',
    description: 'Develop self-awareness, empathy, and emotional regulation for effective leadership.',
  },
  {
    id: 'tc-15',
    title: 'DevOps for Product Managers',
    date: '2026-05-05',
    startTime: '10:00',
    endTime: '12:00',
    category: 'Cross-Training',
    instructor: 'Liam Carter',
    location: 'Virtual - Zoom',
    description: 'Cross-training session on CI/CD pipelines, deployment workflows, and DevOps culture.',
  },
];

export type LearningMaterial = {
  id: string;
  category: string;
  title: string;
  description: string;
  durationHours: number;
  type: LearningMaterialType;
  level: LearningLevel;
};

export type CoreCompetency = {
  id: string;
  name: string;
  description: string;
  level: string;
  learningMaterialCount: number;
};

export type TrainingStatus = 'Not Started' | 'In Progress' | 'Completed';

export type TrainingProgressRecord = {
  id: string;
  employeeName: string;
  materialId: string;
  trainingTitle: string;
  competencyArea: string;
  status: TrainingStatus;
  progress: number;
  movement: string;
  startedOn: string;
  lastActivity: string;
  completedOn?: string;
};

export const learningMaterials: LearningMaterial[] = [
  {
    id: 'ld-1',
    category: 'Leadership',
    title: 'Leadership in Practice',
    description: 'Develop executive presence, strategic thinking, and people leadership capabilities.',
    durationHours: 5,
    type: 'Course',
    level: 'Advanced',
  },
  {
    id: 'ld-2',
    category: 'Communication',
    title: 'Effective Communication',
    description: 'Master verbal and written communication techniques for professional environments.',
    durationHours: 2,
    type: 'Workshop',
    level: 'Beginner',
  },
  {
    id: 'ld-3',
    category: 'Data & Analytics',
    title: 'Data Analysis Fundamentals',
    description: 'Learn to analyse and interpret business data using modern tools and frameworks.',
    durationHours: 4,
    type: 'Course',
    level: 'Intermediate',
  },
  {
    id: 'ld-4',
    category: 'Project Management',
    title: 'Project Delivery Essentials',
    description: 'Core methods for planning, executing, and closing projects successfully.',
    durationHours: 3,
    type: 'Course',
    level: 'Intermediate',
  },
  {
    id: 'ld-5',
    category: 'Client Relations',
    title: 'Client Relationship Mastery',
    description: 'Build long-term client partnerships through trust, service excellence, and communication.',
    durationHours: 2,
    type: 'Workshop',
    level: 'Intermediate',
  },
  {
    id: 'ld-6',
    category: 'Compliance',
    title: 'Compliance & Ethics',
    description: 'Understand regulatory requirements, company policy, and ethical decision making.',
    durationHours: 1,
    type: 'Module',
    level: 'Beginner',
  },
];

export const coreCompetencies: CoreCompetency[] = [
  ...adminMockData.competencies.map((item) => ({
    id: item.id,
    name: item.competencyName,
    description: item.competencyDescription,
    level: item.competencyLevel,
    learningMaterialCount: Math.max(1, item.learningMaterials.length),
  })),
  {
    id: 'core-4',
    name: 'Leadership',
    description: 'Guides teams through clear direction, coaching, and timely decision making.',
    level: 'Leadership/Management Level',
    learningMaterialCount: 3,
  },
  {
    id: 'core-5',
    name: 'Data Literacy',
    description: 'Uses data to evaluate progress, identify gaps, and support business decisions.',
    level: 'Intermediate Level',
    learningMaterialCount: 2,
  },
  {
    id: 'core-6',
    name: 'Compliance',
    description: 'Applies legal, policy, and ethical standards in daily work practices.',
    level: 'Entry Level',
    learningMaterialCount: 2,
  },
];

export const initialTrainingProgressRecords: TrainingProgressRecord[] = [
  {
    id: 'progress-1',
    employeeName: 'Michael Chen',
    materialId: 'ld-1',
    trainingTitle: 'Leadership in Practice',
    competencyArea: 'Leadership',
    status: 'In Progress',
    progress: 65,
    movement: '+15% this week',
    startedOn: '2026-03-12',
    lastActivity: '2026-03-30',
  },
  {
    id: 'progress-2',
    employeeName: 'Michael Chen',
    materialId: 'ld-6',
    trainingTitle: 'Compliance & Ethics',
    competencyArea: 'Compliance',
    status: 'Completed',
    progress: 100,
    movement: '+100% complete',
    startedOn: '2026-03-11',
    lastActivity: '2026-03-20',
    completedOn: '2026-03-20',
  },
  {
    id: 'progress-3',
    employeeName: 'Sarah Johnson',
    materialId: 'ld-3',
    trainingTitle: 'Data Analysis Fundamentals',
    competencyArea: 'Data & Analytics',
    status: 'In Progress',
    progress: 40,
    movement: '+10% this week',
    startedOn: '2026-03-09',
    lastActivity: '2026-03-29',
  },
  {
    id: 'progress-4',
    employeeName: 'David Lee',
    materialId: 'ld-2',
    trainingTitle: 'Effective Communication',
    competencyArea: 'Communication',
    status: 'Completed',
    progress: 100,
    movement: '+100% complete',
    startedOn: '2026-03-05',
    lastActivity: '2026-03-18',
    completedOn: '2026-03-18',
  },
];
