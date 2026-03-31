import { useMemo, useState } from 'react';
import './MenuPages.css';

type TasksTab = 'my' | 'team';
type TaskStatus = 'In Progress' | 'Completed' | 'Late' | 'Closed';

type TaskRow = {
  id: string;
  task: string;
  linkedKpi: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: TaskStatus;
};

type TeamTaskRow = TaskRow & {
  employee: string;
};

type DirectReportTasks = {
  employee: string;
  role: string;
  tasks: TeamTaskRow[];
};

const rowsPerPageOptions = [5, 10, 25];

const kpiOptions = [
  'Training Completion Rate',
  'Performance Review Completion',
  'Quarterly Employee Retention',
];

const initialMyTasks: TaskRow[] = [
  {
    id: 'task-1',
    task: 'Finalize onboarding training materials',
    linkedKpi: 'Training Completion Rate',
    description: 'Update onboarding modules with Q1 process changes.',
    startDate: '2026-01-06',
    endDate: '2026-01-27',
    progress: 80,
    status: 'In Progress',
  },
  {
    id: 'task-2',
    task: 'Follow up overdue performance reviews',
    linkedKpi: 'Performance Review Completion',
    description: 'Send reminders and schedule manager check-ins.',
    startDate: '2026-01-10',
    endDate: '2026-01-25',
    progress: 50,
    status: 'Late',
  },
  {
    id: 'task-3',
    task: 'Run retention pulse survey',
    linkedKpi: 'Quarterly Employee Retention',
    description: 'Launch survey, monitor response rate, share summary.',
    startDate: '2026-01-02',
    endDate: '2026-01-19',
    progress: 100,
    status: 'Completed',
  },
  {
    id: 'task-4',
    task: 'Prepare monthly HR KPI report',
    linkedKpi: 'Training Completion Rate',
    description: 'Compile dashboard metrics and add trend notes.',
    startDate: '2026-01-12',
    endDate: '2026-01-31',
    progress: 25,
    status: 'In Progress',
  },
];

const teamTaskRows: TeamTaskRow[] = [
  {
    id: 'team-task-1',
    employee: 'Alex Johnson',
    task: 'Review hiring funnel conversion',
    linkedKpi: 'Time to Fill Open Roles',
    description: 'Audit pass-through rates per hiring stage.',
    startDate: '2026-01-03',
    endDate: '2026-01-24',
    progress: 90,
    status: 'In Progress',
  },
  {
    id: 'team-task-2',
    employee: 'Taylor Smith',
    task: 'Coach managers on review quality',
    linkedKpi: 'Performance Review Completion',
    description: 'Run 2 enablement sessions and share rubric.',
    startDate: '2026-01-08',
    endDate: '2026-01-28',
    progress: 62,
    status: 'Late',
  },
  {
    id: 'team-task-3',
    employee: 'Jordan Lee',
    task: 'Close training policy gaps',
    linkedKpi: 'Training Completion Rate',
    description: 'Identify compliance blockers and resolve ownership.',
    startDate: '2026-01-05',
    endDate: '2026-01-22',
    progress: 74,
    status: 'Completed',
  },
  {
    id: 'team-task-4',
    employee: 'Morgan Patel',
    task: 'Re-engagement outreach plan',
    linkedKpi: 'Quarterly Employee Retention',
    description: 'Complete outreach playbook for high-risk segments.',
    startDate: '2026-01-09',
    endDate: '2026-01-30',
    progress: 48,
    status: 'Closed',
  },
];

const directReportTaskTables: DirectReportTasks[] = [
  {
    employee: 'Alex Johnson',
    role: 'HR Specialist',
    tasks: [
      {
        id: 'alex-task-1',
        employee: 'Alex Johnson',
        task: 'Review hiring funnel conversion',
        linkedKpi: 'Time to Fill Open Roles',
        description: 'Audit pass-through rates per hiring stage.',
        startDate: '2026-01-03',
        endDate: '2026-01-24',
        progress: 90,
        status: 'In Progress',
      },
      {
        id: 'alex-task-2',
        employee: 'Alex Johnson',
        task: 'Complete monthly onboarding audit',
        linkedKpi: 'Training Completion Rate',
        description: 'Validate training checklist for new hires.',
        startDate: '2026-01-01',
        endDate: '2026-01-16',
        progress: 100,
        status: 'Completed',
      },
    ],
  },
  {
    employee: 'Taylor Smith',
    role: 'Recruitment Partner',
    tasks: [
      {
        id: 'taylor-task-1',
        employee: 'Taylor Smith',
        task: 'Coach managers on review quality',
        linkedKpi: 'Performance Review Completion',
        description: 'Run 2 enablement sessions and share rubric.',
        startDate: '2026-01-08',
        endDate: '2026-01-28',
        progress: 62,
        status: 'Late',
      },
      {
        id: 'taylor-task-2',
        employee: 'Taylor Smith',
        task: 'Close quarter hiring report',
        linkedKpi: 'Time to Fill Open Roles',
        description: 'Finalize and submit recruiting metrics.',
        startDate: '2026-01-03',
        endDate: '2026-01-20',
        progress: 100,
        status: 'Closed',
      },
    ],
  },
  {
    employee: 'Jordan Lee',
    role: 'People Operations',
    tasks: [
      {
        id: 'jordan-task-1',
        employee: 'Jordan Lee',
        task: 'Close training policy gaps',
        linkedKpi: 'Training Completion Rate',
        description: 'Identify compliance blockers and resolve ownership.',
        startDate: '2026-01-05',
        endDate: '2026-01-22',
        progress: 74,
        status: 'Completed',
      },
      {
        id: 'jordan-task-2',
        employee: 'Jordan Lee',
        task: 'Update retention action playbook',
        linkedKpi: 'Quarterly Employee Retention',
        description: 'Publish updated retention response templates.',
        startDate: '2026-01-09',
        endDate: '2026-01-27',
        progress: 51,
        status: 'In Progress',
      },
    ],
  },
];

function formatDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '-';
}

function isPastDate(value: string) {
  if (!value) {
    return false;
  }

  const targetDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(startIndex, startIndex + pageSize),
    totalPages,
    safePage,
  };
}

function calculateAverageProgress(tasks: Array<{ progress: number }>) {
  if (!tasks.length) {
    return 0;
  }

  const sum = tasks.reduce((total, task) => total + task.progress, 0);
  return Math.round(sum / tasks.length);
}

function getStatusClassName(status: TaskStatus) {
  return `menu-status-badge ${status.toLowerCase().replace(' ', '-')}`;
}

function normalizeTaskStatus(progress: number, endDate: string): TaskStatus {
  if (progress === 100) {
    return 'Completed';
  }
  return isPastDate(endDate) ? 'Late' : 'In Progress';
}

function TasksPage() {
  const [activeTab, setActiveTab] = useState<TasksTab>('my');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditProgressModal, setShowEditProgressModal] = useState(false);
  const [tasks, setTasks] = useState<TaskRow[]>(initialMyTasks);
  const [myTasksPage, setMyTasksPage] = useState(1);
  const [teamCurrentTasksPage, setTeamCurrentTasksPage] = useState(1);
  const [directReportTaskPages, setDirectReportTaskPages] = useState<Record<string, number>>({});
  const [myTasksRowsPerPage, setMyTasksRowsPerPage] = useState(5);
  const [teamCurrentTasksRowsPerPage, setTeamCurrentTasksRowsPerPage] = useState(5);
  const [directReportTaskRowsPerPage, setDirectReportTaskRowsPerPage] = useState<Record<string, number>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingLinkedKpi, setEditingLinkedKpi] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingProgress, setEditingProgress] = useState(0);
  const [editingStartDate, setEditingStartDate] = useState('');
  const [editingEndDate, setEditingEndDate] = useState('');
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    linkedKpi: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const showTeamTasksTab = true;

  const taskAccomplishment = useMemo(() => calculateAverageProgress(tasks), [tasks]);
  const teamTaskAccomplishment = useMemo(() => calculateAverageProgress(teamTaskRows), []);
  const teamCurrentTasks = useMemo(
    () => teamTaskRows.filter((task) => task.status === 'In Progress' || task.status === 'Late'),
    [],
  );

  const myTasksPagination = paginateRows(tasks, myTasksPage, myTasksRowsPerPage);
  const teamCurrentTasksPagination = paginateRows(teamCurrentTasks, teamCurrentTasksPage, teamCurrentTasksRowsPerPage);

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) ?? null,
    [editingTaskId, tasks],
  );
  const normalizedStatusPreview = useMemo(
    () => normalizeTaskStatus(editingProgress, editingEndDate),
    [editingProgress, editingEndDate],
  );

  function openAddTaskModal() {
    setNewTaskForm({
      title: '',
      linkedKpi: '',
      description: '',
      startDate: '',
      endDate: '',
    });
    setShowAddTaskModal(true);
  }

  function handleNewTaskFieldChange(field: keyof typeof newTaskForm, value: string) {
    setNewTaskForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleAddTask() {
    if (!newTaskForm.title.trim() || !newTaskForm.linkedKpi || !newTaskForm.startDate || !newTaskForm.endDate) {
      return;
    }

    setTasks((previous) => [
      ...previous,
      {
        id: `task-${Date.now()}`,
        task: newTaskForm.title.trim(),
        linkedKpi: newTaskForm.linkedKpi,
        description: newTaskForm.description.trim() || '-',
        startDate: newTaskForm.startDate,
        endDate: newTaskForm.endDate,
        progress: 0,
        status: normalizeTaskStatus(0, newTaskForm.endDate),
      },
    ]);
    setShowAddTaskModal(false);
  }

  function openEditProgressModal(taskId: string) {
    const task = tasks.find((row) => row.id === taskId);
    if (!task) {
      return;
    }

    setEditingTaskId(task.id);
    setEditingTitle(task.task);
    setEditingLinkedKpi(task.linkedKpi);
    setEditingDescription(task.description);
    setEditingProgress(task.progress);
    setEditingStartDate(task.startDate);
    setEditingEndDate(task.endDate);
    setShowEditProgressModal(true);
  }

  function handleSaveProgress() {
    if (!editingTaskId || !editingTitle.trim() || !editingLinkedKpi) {
      return;
    }

    const normalizedStatus = normalizeTaskStatus(editingProgress, editingEndDate);
    setTasks((previous) => previous.map((task) => (
      task.id === editingTaskId
        ? {
          ...task,
          task: editingTitle.trim(),
          linkedKpi: editingLinkedKpi,
          description: editingDescription.trim() || '-',
          progress: editingProgress,
          startDate: editingStartDate,
          endDate: editingEndDate,
          status: normalizedStatus,
        }
        : task
    )));
    setShowEditProgressModal(false);
    setEditingTaskId(null);
  }

  return (
    <section className="menu-page">
      <h1>Tasks</h1>
      <p>Monitor task completion and link tasks to existing KPIs.</p>

      <div className="menu-tabs">
        <button
          type="button"
          className={`menu-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My Tasks
        </button>
        {showTeamTasksTab && (
          <button
            type="button"
            className={`menu-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            My Team Tasks
          </button>
        )}
      </div>

      <div className="menu-card">
        <div className="metric-card-header">
          <h2>{activeTab === 'my' ? 'Total Task Accomplishment' : 'Team Task Accomplishment'}</h2>
          <strong>{activeTab === 'my' ? taskAccomplishment : teamTaskAccomplishment}%</strong>
        </div>
        <div className="metric-progress-track" aria-hidden="true">
          <div
            className="metric-progress-fill"
            style={{ width: `${activeTab === 'my' ? taskAccomplishment : teamTaskAccomplishment}%` }}
          />
        </div>
      </div>

      <div className="menu-card">
        <div className="task-action-row">
          <h2>{activeTab === 'my' ? 'Task List' : 'Team Current Tasks'}</h2>
          {activeTab === 'my' && (
            <button type="button" className="menu-button" onClick={openAddTaskModal}>
              Add Task
            </button>
          )}
        </div>

        <div className="menu-table-wrap">
          <table className="menu-table">
            <thead>
              <tr>
                {activeTab === 'team' && <th>Employee</th>}
                <th>Task</th>
                <th>Linked KPI</th>
                <th>Description</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Progress</th>
                <th>Status</th>
                {activeTab === 'my' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'my' && myTasksPagination.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.task}</td>
                  <td>{row.linkedKpi}</td>
                  <td>{row.description}</td>
                  <td>{formatDate(row.startDate)}</td>
                  <td>{formatDate(row.endDate)}</td>
                  <td>{row.progress}%</td>
                  <td>
                    <span className={getStatusClassName(row.status)}>{row.status}</span>
                  </td>
                  <td>
                    <button type="button" className="menu-inline-button" onClick={() => openEditProgressModal(row.id)}>
                      Edit Progress
                    </button>
                  </td>
                </tr>
              ))}
              {activeTab === 'team' && teamCurrentTasksPagination.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.employee}</td>
                  <td>{row.task}</td>
                  <td>{row.linkedKpi}</td>
                  <td>{row.description}</td>
                  <td>{formatDate(row.startDate)}</td>
                  <td>{formatDate(row.endDate)}</td>
                  <td>{row.progress}%</td>
                  <td>
                    <span className={getStatusClassName(row.status)}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="menu-pagination">
          <label className="menu-pagination-size">
            Rows:
            <select
              className="menu-select"
              value={activeTab === 'my' ? myTasksRowsPerPage : teamCurrentTasksRowsPerPage}
              onChange={(event) => {
                const nextRowsPerPage = Number(event.target.value);
                if (activeTab === 'my') {
                  setMyTasksRowsPerPage(nextRowsPerPage);
                  setMyTasksPage(1);
                } else {
                  setTeamCurrentTasksRowsPerPage(nextRowsPerPage);
                  setTeamCurrentTasksPage(1);
                }
              }}
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="menu-pagination-btn"
            onClick={() => (activeTab === 'my'
              ? setMyTasksPage((page) => Math.max(1, page - 1))
              : setTeamCurrentTasksPage((page) => Math.max(1, page - 1)))}
            disabled={activeTab === 'my' ? myTasksPagination.safePage <= 1 : teamCurrentTasksPagination.safePage <= 1}
          >
            Previous
          </button>
          <span>
            Page {activeTab === 'my' ? myTasksPagination.safePage : teamCurrentTasksPagination.safePage} of{' '}
            {activeTab === 'my' ? myTasksPagination.totalPages : teamCurrentTasksPagination.totalPages}
          </span>
          <button
            type="button"
            className="menu-pagination-btn"
            onClick={() => (activeTab === 'my'
              ? setMyTasksPage((page) => Math.min(myTasksPagination.totalPages, page + 1))
              : setTeamCurrentTasksPage((page) => Math.min(teamCurrentTasksPagination.totalPages, page + 1)))}
            disabled={activeTab === 'my'
              ? myTasksPagination.safePage >= myTasksPagination.totalPages
              : teamCurrentTasksPagination.safePage >= teamCurrentTasksPagination.totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {activeTab === 'team' && (
        <div className="menu-card">
          <h2>Direct Report Task Status</h2>
          <div className="menu-stacked-sections">
            {directReportTaskTables.map((report) => {
              const reportPage = directReportTaskPages[report.employee] ?? 1;
              const reportRowsPerPage = directReportTaskRowsPerPage[report.employee] ?? 5;
              const reportPagination = paginateRows(report.tasks, reportPage, reportRowsPerPage);

              return (
                <article key={report.employee} className="menu-subsection-card">
                  <div className="menu-subsection-header">
                    <h3>{report.employee}</h3>
                    <p>{report.role}</p>
                  </div>
                  <div className="menu-table-wrap">
                    <table className="menu-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Linked KPI</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Progress</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportPagination.rows.map((task) => (
                          <tr key={task.id}>
                            <td>{task.task}</td>
                            <td>{task.linkedKpi}</td>
                            <td>{formatDate(task.startDate)}</td>
                            <td>{formatDate(task.endDate)}</td>
                            <td>{task.progress}%</td>
                            <td>
                              <span className={getStatusClassName(task.status)}>{task.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="menu-pagination">
                    <label className="menu-pagination-size">
                      Rows:
                      <select
                        className="menu-select"
                        value={reportRowsPerPage}
                        onChange={(event) => {
                          const nextRowsPerPage = Number(event.target.value);
                          setDirectReportTaskRowsPerPage((previous) => ({
                            ...previous,
                            [report.employee]: nextRowsPerPage,
                          }));
                          setDirectReportTaskPages((previous) => ({
                            ...previous,
                            [report.employee]: 1,
                          }));
                        }}
                      >
                        {rowsPerPageOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="menu-pagination-btn"
                      onClick={() => setDirectReportTaskPages((previous) => ({
                        ...previous,
                        [report.employee]: Math.max(1, reportPagination.safePage - 1),
                      }))}
                      disabled={reportPagination.safePage <= 1}
                    >
                      Previous
                    </button>
                    <span>Page {reportPagination.safePage} of {reportPagination.totalPages}</span>
                    <button
                      type="button"
                      className="menu-pagination-btn"
                      onClick={() => setDirectReportTaskPages((previous) => ({
                        ...previous,
                        [report.employee]: Math.min(reportPagination.totalPages, reportPagination.safePage + 1),
                      }))}
                      disabled={reportPagination.safePage >= reportPagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="menu-modal-backdrop" onClick={() => setShowAddTaskModal(false)}>
          <section
            className="menu-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="menu-modal-header">
              <h3 id="add-task-modal-title">Add Task</h3>
              <button type="button" className="menu-modal-close-btn" onClick={() => setShowAddTaskModal(false)}>
                Close
              </button>
            </div>
            <div className="menu-modal-grid">
              <label className="menu-form-field">
                <span>Task Title</span>
                <input
                  className="menu-input"
                  type="text"
                  value={newTaskForm.title}
                  onChange={(event) => handleNewTaskFieldChange('title', event.target.value)}
                  placeholder="Enter task title"
                />
              </label>
              <label className="menu-form-field">
                <span>KPI</span>
                <select
                  className="menu-select"
                  value={newTaskForm.linkedKpi}
                  onChange={(event) => handleNewTaskFieldChange('linkedKpi', event.target.value)}
                >
                  <option value="">Select KPI</option>
                  {kpiOptions.map((kpi) => (
                    <option key={kpi} value={kpi}>
                      {kpi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="menu-form-field menu-form-field-full">
                <span>Task Description</span>
                <textarea
                  className="menu-textarea"
                  value={newTaskForm.description}
                  onChange={(event) => handleNewTaskFieldChange('description', event.target.value)}
                  placeholder="Enter task description"
                  rows={4}
                />
              </label>
              <label className="menu-form-field">
                <span>Start Date</span>
                <input
                  className="menu-input"
                  type="date"
                  value={newTaskForm.startDate}
                  onChange={(event) => handleNewTaskFieldChange('startDate', event.target.value)}
                />
              </label>
              <label className="menu-form-field">
                <span>End Date</span>
                <input
                  className="menu-input"
                  type="date"
                  value={newTaskForm.endDate}
                  onChange={(event) => handleNewTaskFieldChange('endDate', event.target.value)}
                />
              </label>
            </div>
            <div className="menu-modal-actions">
              <button type="button" className="menu-secondary-button" onClick={() => setShowAddTaskModal(false)}>
                Cancel
              </button>
              <button type="button" className="menu-button" onClick={handleAddTask}>
                Save Task
              </button>
            </div>
          </section>
        </div>
      )}

      {showEditProgressModal && editingTask && (
        <div className="menu-modal-backdrop" onClick={() => setShowEditProgressModal(false)}>
          <section
            className="menu-modal menu-modal-compact"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-progress-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="menu-modal-header">
              <h3 id="edit-task-progress-title">Edit Task Progress</h3>
              <button type="button" className="menu-modal-close-btn" onClick={() => setShowEditProgressModal(false)}>
                Close
              </button>
            </div>
            <p className="menu-modal-subtitle">{editingTask.task}</p>
            <div className="menu-modal-grid">
              <label className="menu-form-field">
                <span>Task Title</span>
                <input
                  className="menu-input"
                  type="text"
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                />
              </label>
              <label className="menu-form-field">
                <span>KPI</span>
                <select
                  className="menu-select"
                  value={editingLinkedKpi}
                  onChange={(event) => setEditingLinkedKpi(event.target.value)}
                >
                  <option value="">Select KPI</option>
                  {kpiOptions.map((kpi) => (
                    <option key={kpi} value={kpi}>
                      {kpi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="menu-form-field menu-form-field-full">
                <span>Task Description</span>
                <textarea
                  className="menu-textarea"
                  value={editingDescription}
                  onChange={(event) => setEditingDescription(event.target.value)}
                  rows={3}
                />
              </label>
            </div>
            <label className="menu-form-field">
              <span>Progress: {editingProgress}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={editingProgress}
                onChange={(event) => setEditingProgress(Number(event.target.value))}
              />
            </label>
            <div className="menu-modal-grid">
              <label className="menu-form-field">
                <span>Start Date</span>
                <input
                  className="menu-input"
                  type="date"
                  value={editingStartDate}
                  onChange={(event) => setEditingStartDate(event.target.value)}
                />
              </label>
              <label className="menu-form-field">
                <span>End Date</span>
                <input
                  className="menu-input"
                  type="date"
                  value={editingEndDate}
                  onChange={(event) => setEditingEndDate(event.target.value)}
                />
              </label>
            </div>
            <p className="menu-modal-note">
              Status will be saved as <strong>{normalizedStatusPreview}</strong> based on progress and due date.
            </p>
            <div className="menu-modal-actions">
              <button type="button" className="menu-secondary-button" onClick={() => setShowEditProgressModal(false)}>
                Cancel
              </button>
              <button type="button" className="menu-button" onClick={handleSaveProgress}>
                Save Progress
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default TasksPage;
