export const reviewsMockData = {
  pageTitle: 'Performance Reviews',
  subtitle: 'Manage and complete performance evaluations',
  permissions: {
    showTeamReviewsTab: true,
    showCreateEvaluationButton: true,
  },
  tabs: {
    myReviews: [
      {
        id: 'my-1',
        title: 'Q1 2026 Performance Review',
        employee: 'Michael Chen',
        manager: 'Sarah Johnson',
        dueDate: '3/31/2026',
        status: 'Pending',
      },
      {
        id: 'my-2',
        title: 'Mid-Year 2026 Self Evaluation',
        employee: 'Michael Chen',
        manager: 'Sarah Johnson',
        dueDate: '6/30/2026',
        status: 'In Progress',
      },
    ],
    teamReviews: [
      {
        id: 'team-1',
        title: 'Q1 2026 Performance Review',
        employee: 'John Smith',
        manager: 'Sarah Johnson',
        dueDate: '3/31/2026',
        status: 'Pending',
      },
      {
        id: 'team-2',
        title: 'Q1 2026 Performance Review',
        employee: 'Emily Davis',
        manager: 'Sarah Johnson',
        dueDate: '3/31/2026',
        status: 'In Progress',
      },
    ],
  },
  evaluationTemplate: {
    reviewee: 'John Smith',
    title: 'Q2 2026 Performance Evaluation',
    sections: [
      {
        id: 'section-1',
        label: 'Goals and Outcomes',
        questions: [
          {
            id: 'question-1',
            prompt: 'What were your top achievements this quarter?',
            type: 'Long Answer',
            options: [],
          },
          {
            id: 'question-2',
            prompt: 'Rate progress toward quarterly goals.',
            type: '5-Star Rating',
            options: [],
          },
        ],
      },
      {
        id: 'section-2',
        label: 'Collaboration',
        questions: [
          {
            id: 'question-3',
            prompt: 'Which collaboration areas need improvement?',
            type: 'Multiple Choice',
            options: ['Communication', 'Accountability', 'Knowledge Sharing'],
          },
          {
            id: 'question-4',
            prompt: 'How effectively did the employee support team outcomes?',
            type: 'Single Choice',
            options: ['Exceeds Expectations', 'Meets Expectations', 'Needs Improvement'],
          },
        ],
      },
    ],
  },
};

export const surveysMockData = {
  pageTitle: 'Surveys',
  subtitle: 'Collect employee sentiment and insights with targeted survey campaigns',
  tabs: {
    activeSurveys: [
      {
        id: 'active-1',
        title: 'Q1 Employee Engagement Pulse',
        audience: 'All Employees',
        dueDate: '3/12/2026',
        estimatedTime: '5 min',
        questionCount: 12,
        status: 'Active',
      },
      {
        id: 'active-2',
        title: 'Remote Work Experience Survey',
        audience: 'Product & Engineering',
        dueDate: '3/19/2026',
        estimatedTime: '7 min',
        questionCount: 18,
        status: 'Active',
      },
      {
        id: 'active-3',
        title: 'Manager Effectiveness Check-In',
        audience: 'Marketing Team',
        dueDate: '3/24/2026',
        estimatedTime: '4 min',
        questionCount: 10,
        status: 'Active',
      },
    ],
    mySurveys: [
      {
        id: 'my-1',
        title: 'Q1 Employee Engagement Pulse',
        audience: 'All Employees',
        createdDate: '2/05/2026',
        dueDate: '3/12/2026',
        status: 'Active',
        responseCount: 142,
      },
      {
        id: 'my-2',
        title: 'Benefits Satisfaction Survey',
        audience: 'United States',
        createdDate: '1/28/2026',
        dueDate: '2/22/2026',
        status: 'Completed',
        responseCount: 186,
      },
      {
        id: 'my-3',
        title: 'Engineering Retrospective Survey',
        audience: 'Engineering Team',
        createdDate: '2/15/2026',
        dueDate: '3/01/2026',
        status: 'Draft',
        responseCount: 0,
      },
      {
        id: 'my-4',
        title: 'Leadership Communication Feedback',
        audience: 'Customer Success',
        createdDate: '1/10/2026',
        dueDate: '1/31/2026',
        status: 'Inactive',
        responseCount: 26,
      },
    ],
  },
  surveyTemplate: {
    scope: 'All Employees',
    title: 'Employee Experience Pulse',
    sections: [
      {
        id: 'section-1',
        label: 'Engagement',
        questions: [
          {
            id: 'question-1',
            prompt: 'How engaged do you feel in your day-to-day work?',
            type: '5-Star Rating',
            options: [],
          },
          {
            id: 'question-2',
            prompt: 'What is one thing that would improve your engagement?',
            type: 'Long Answer',
            options: [],
          },
        ],
      },
      {
        id: 'section-2',
        label: 'Collaboration and Support',
        questions: [
          {
            id: 'question-3',
            prompt: 'Which areas need the most support?',
            type: 'Multiple Choice',
            options: ['Tools', 'Processes', 'Communication', 'Training'],
          },
          {
            id: 'question-4',
            prompt: 'I receive timely support when blocked.',
            type: 'Single Choice',
            options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
          },
        ],
      },
    ],
  },
};

export const feedbackMockData = {
  pageTitle: 'Feedback',
  subtitle: 'Track feedback you have received and feedback you have shared',
  recipients: ['Michael Chen', 'Sarah Johnson', 'Emily Davis', 'John Smith'],
  tabs: {
    received: [
      {
        id: 'received-1',
        title: 'Great Ownership',
        from: 'Sarah Johnson',
        date: '2/16/2026',
        description: 'You showed strong ownership in sprint delivery and kept everyone aligned.',
      },
      {
        id: 'received-2',
        title: 'Collaboration',
        from: 'Emily Davis',
        date: '2/10/2026',
        description: 'Great collaboration on onboarding documentation and quick support for new hires.',
      },
    ],
    given: [
      {
        id: 'given-1',
        title: 'Thanks for Support',
        to: 'John Smith',
        date: '2/12/2026',
        description: 'Thanks for helping unblock the payroll integration this week.',
      },
      {
        id: 'given-2',
        title: 'Workshop Facilitation',
        to: 'Michael Chen',
        date: '2/08/2026',
        description: 'Excellent facilitation in the team workshop. The structure was clear and practical.',
      },
    ],
  },
};

export const recognitionsMockData = {
  pageTitle: 'Recognitions',
  subtitle: 'Celebrate great work and redeem rewards with recognition points',
  recognitionPoints: 240,
  recipients: ['Michael Chen', 'Sarah Johnson', 'Emily Davis', 'John Smith'],
  permissions: {
    canGiveSpecialBadge: true,
  },
  badges: [
    { id: 'badge-1', label: 'Inspirational Leader', icon: '🌟', points: 0, special: false },
    { id: 'badge-2', label: 'Great Idea', icon: '💡', points: 0, special: false },
    { id: 'badge-3', label: 'High Energy', icon: '⚡', points: 0, special: false },
    { id: 'badge-4', label: 'Great Job', icon: '👍', points: 0, special: false },
    { id: 'badge-5', label: 'Outside the Box Thinker', icon: '🧠', points: 0, special: false },
    { id: 'badge-6', label: 'Team Player', icon: '🤝', points: 0, special: false },
    { id: 'badge-7', label: 'Going Above and Beyond', icon: '🚀', points: 0, special: false },
    { id: 'badge-special', label: 'HR Spotlight Award', icon: '🏆', points: 50, special: true },
  ],
  tabs: {
    received: [
      {
        id: 'received-1',
        badgeId: 'badge-6',
        badgeLabel: 'Team Player',
        from: 'Sarah Johnson',
        date: '2/15/2026',
        message: 'Great support during the hiring process and excellent team collaboration.',
      },
      {
        id: 'received-2',
        badgeId: 'badge-7',
        badgeLabel: 'Going Above and Beyond',
        from: 'Emily Davis',
        date: '2/09/2026',
        message: 'You stepped in quickly and helped close urgent onboarding tasks.',
      },
    ],
    given: [
      {
        id: 'given-1',
        badgeId: 'badge-4',
        badgeLabel: 'Great Job',
        to: 'John Smith',
        date: '2/12/2026',
        message: 'Excellent work leading the monthly planning update.',
        points: 0,
      },
      {
        id: 'given-2',
        badgeId: 'badge-special',
        badgeLabel: 'HR Spotlight Award',
        to: 'Michael Chen',
        date: '2/05/2026',
        message: 'Outstanding leadership support during policy rollout.',
        points: 50,
      },
    ],
  },
  redeemRewards: [
    {
      id: 'reward-1',
      name: 'Starbucks Gift Card',
      pointsCost: 100,
      description: '$10 Starbucks digital gift card',
    },
    {
      id: 'reward-2',
      name: 'Lunch Voucher',
      pointsCost: 150,
      description: 'Lunch voucher redeemable at partner restaurants',
    },
    {
      id: 'reward-3',
      name: 'Learning Credit',
      pointsCost: 200,
      description: 'Credit for books or online learning platform',
    },
  ],
  redeemedRewards: [
    {
      id: 'redeemed-1',
      name: 'Coffee Voucher',
      pointsCost: 80,
      redeemedDate: '1/18/2026',
    },
  ],
  labels: {
    specialBadgeOnlyFor: 'Special badge - HR/Admin only',
  },
};
