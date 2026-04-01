export type AdminUser = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  teamflectRole: string;
  department: string;
  officeLocation: string;
  birthday: string;
  country: string;
  employeeHireDate: string;
  manager: string;
  reportsTo: string;
  directReports: string[];
  jobTitle: string;
  rolePosition: string;
  attachments: string;
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
  type: 'Link';
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
  pageTitle: 'HR Center',
  subtitle: 'Manage users who can access the Teamflect portal',
  users: [
    {
      id: 'admin-user-1',
      name: 'Michael Chen',
      title: 'VP of Human Resources',
      email: 'michael.chen@cirrusglobal.com',
      phone: '+1 (555) 111-2222',
      teamflectRole: 'Admin',
      department: 'Human Resources',
      officeLocation: 'New York, NY',
      birthday: 'November 20, 1985',
      country: 'United States',
      employeeHireDate: 'January 15, 2015',
      manager: 'Sarah Johnson',
      reportsTo: 'Sarah Johnson',
      directReports: ['Grace Walker', 'James Foster', 'Chloe Bennett'],
      jobTitle: 'HR Business Partner',
      rolePosition: 'HR Business Partner',
      attachments: 'Policy Ack',
    },
    {
      id: 'admin-user-2',
      name: 'Emily Davis',
      title: 'Marketing Lead',
      email: 'emily.davis@cirrusglobal.com',
      phone: '+1 (555) 333-4444',
      teamflectRole: 'Manager',
      department: 'Marketing',
      officeLocation: 'Toronto, ON',
      birthday: 'March 8, 1990',
      country: 'Canada',
      employeeHireDate: 'June 1, 2019',
      manager: 'Sarah Johnson',
      reportsTo: 'Sarah Johnson',
      directReports: ['Ava Turner', 'Mason Reed'],
      jobTitle: 'Marketing Lead',
      rolePosition: '',
      attachments: 'NDA',
    },
    {
      id: 'admin-user-3',
      name: 'John Smith',
      title: 'Software Engineer',
      email: 'john.smith@cirrusglobal.com',
      phone: '+44 (20) 7946-0958',
      teamflectRole: 'Employee',
      department: 'Engineering',
      officeLocation: 'London, UK',
      birthday: 'July 14, 1992',
      country: 'United Kingdom',
      employeeHireDate: 'September 10, 2021',
      manager: 'Michael Chen',
      reportsTo: 'Michael Chen',
      directReports: [],
      jobTitle: 'Software Engineer',
      rolePosition: 'Software Engineer',
      attachments: 'Contract',
    },
    {
      id: 'admin-user-4',
      name: 'Sarah Johnson',
      title: 'Operations Director',
      email: 'sarah.johnson@cirrusglobal.com',
      phone: '+1 (555) 555-6666',
      teamflectRole: 'Admin',
      department: 'Operations',
      officeLocation: 'New York, NY',
      birthday: 'January 5, 1980',
      country: 'United States',
      employeeHireDate: 'March 20, 2012',
      manager: 'Executive Team',
      reportsTo: 'Executive Team',
      directReports: ['Michael Chen', 'Emily Davis'],
      jobTitle: 'Operations Director',
      rolePosition: '',
      attachments: 'Security Training',
    },
  ] as AdminUser[],
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
