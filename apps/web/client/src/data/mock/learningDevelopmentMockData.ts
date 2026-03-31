import { adminMockData } from './adminMockData';

export type LearningMaterialType = 'Course' | 'Workshop' | 'Module';
export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced';

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
