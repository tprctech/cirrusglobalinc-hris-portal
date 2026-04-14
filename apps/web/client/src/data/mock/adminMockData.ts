export type AdminUser = {
  id: number;
  employeeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  birthdate: string;
  gender: string;
  maritalStatus: string;
  homeAddress: string;
  permanentAddress: string;
  team: string;
  regularizationDate: string;
  department: string;
  jobTitle: string;
  jobDescription: string;
  teamflectRole: string;
  dateHired: string;
  status: string;
  supervisor: string;
  reviewers: string;
  sssNumber: string;
  hdmfNumber: string;
  philHealthNumber: string;
  tin: string;
  email: string;
  phone: string;
  country: string;
  officeLocation: string;
  profilePhoto: string;
};

export type AdminCompetency = {
  id: string;
  competencyCode: string;
  competencyName: string;
  competencyDescription: string;
  expectations: string;
  competencyLevel: CompetencyLevel;
  competencyExperts?: string;
  learningMaterials: AdminLearningMaterial[];
};

export type CompetencyLevel =
  | 'C-Level'
  | 'Entry Level'
  | 'Experienced/Professional Level'
  | 'Intermediate Level'
  | 'Leadership/Management Level';

export type AdminLearningMaterial = {
  id: string;
  type: string;
  url: string;
  name: string;
  description?: string;
  category?: string;
  duration?: string;
};

export type AdminRole = {
  id: string;
  roleJobTitle: string;
  roleDescription: string;
  usersInRole: string;
  department: string;
  requiredCompetencies: string;
  createdBy: string;
};

export const adminMockData = {
  pageTitle: 'Core HR',
  subtitle: 'Manage users who can access the application.',
  users: [] as AdminUser[],
  competencies: [
    {
      id: 'competency-1',
      competencyCode: 'CMP-001',
      competencyName: 'Communication',
      competencyDescription: 'Delivers clear and concise communication across teams.',
      expectations: 'Presents updates clearly and listens actively in meetings.',
      competencyLevel: 'Intermediate Level',
      competencyExperts: 'Sarah Johnson',
      learningMaterials: [],
    },
    {
      id: 'competency-2',
      competencyCode: 'CMP-002',
      competencyName: 'Ownership',
      competencyDescription: 'Takes responsibility for outcomes and follow-through.',
      expectations: 'Tracks commitments and closes tasks without repeated follow-up.',
      competencyLevel: 'Experienced/Professional Level',
      competencyExperts: '',
      learningMaterials: [],
    },
    {
      id: 'competency-3',
      competencyCode: 'CMP-003',
      competencyName: 'Collaboration',
      competencyDescription: 'Works effectively with peers and cross-functional partners.',
      expectations: 'Contributes to shared goals and supports team success.',
      competencyLevel: 'Leadership/Management Level',
      competencyExperts: 'Michael Chen',
      learningMaterials: [],
    },
  ] as AdminCompetency[],
  roles: [
    {
      id: 'role-1',
      roleJobTitle: 'Software Engineer',
      roleDescription: 'Builds and maintains product features and platform services.',
      usersInRole: '18',
      department: 'Engineering',
      requiredCompetencies: 'Collaboration, Ownership, Communication',
      createdBy: 'Sarah Johnson',
    },
    {
      id: 'role-2',
      roleJobTitle: 'Engineering Manager',
      roleDescription: 'Leads engineering delivery and develops team members.',
      usersInRole: '4',
      department: 'Engineering',
      requiredCompetencies: 'Leadership, Communication, Coaching',
      createdBy: 'Michael Chen',
    },
    {
      id: 'role-3',
      roleJobTitle: 'HR Business Partner',
      roleDescription: 'Partners with leaders on people programs and performance.',
      usersInRole: '6',
      department: 'Human Resources',
      requiredCompetencies: 'Stakeholder Management, Communication',
      createdBy: 'Sarah Johnson',
    },
  ] as AdminRole[],
};
