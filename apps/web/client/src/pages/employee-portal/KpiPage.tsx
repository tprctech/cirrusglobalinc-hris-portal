import { useState } from 'react';
import './MenuPages.css';

type KpiTab = 'my' | 'team';

type KpiRow = {
  name: string;
  expectedValue: string;
  actualValue: string;
};

type TeamKpiRow = KpiRow & {
  employee: string;
};

type DirectReportKpi = {
  employee: string;
  role: string;
  kpis: KpiRow[];
};

const rowsPerPageOptions = [5, 10, 25];

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

function KpiPage() {
  const [activeTab, setActiveTab] = useState<KpiTab>('my');
  const [myKpiPage, setMyKpiPage] = useState(1);
  const [teamKpiPage, setTeamKpiPage] = useState(1);
  const [directReportKpiPages, setDirectReportKpiPages] = useState<Record<string, number>>({});
  const [myKpiRowsPerPage, setMyKpiRowsPerPage] = useState(5);
  const [teamKpiRowsPerPage, setTeamKpiRowsPerPage] = useState(5);
  const [directReportKpiRowsPerPage, setDirectReportKpiRowsPerPage] = useState<Record<string, number>>({});
  const showTeamKpisTab = true;

  const kpiAccomplishment = 78;
  const myKpiRows: KpiRow[] = [
    { name: 'Time to Fill Open Roles', expectedValue: '<= 30 days', actualValue: '27 days' },
    { name: 'Training Completion Rate', expectedValue: '95%', actualValue: '92%' },
    { name: 'Quarterly Employee Retention', expectedValue: '90%', actualValue: '88%' },
    { name: 'Performance Review Completion', expectedValue: '100%', actualValue: '96%' },
  ];
  const teamKpiRows: TeamKpiRow[] = [
    { employee: 'Alex Johnson', name: 'Training Completion Rate', expectedValue: '95%', actualValue: '98%' },
    { employee: 'Taylor Smith', name: 'Time to Fill Open Roles', expectedValue: '<= 30 days', actualValue: '34 days' },
    { employee: 'Jordan Lee', name: 'Performance Review Completion', expectedValue: '100%', actualValue: '100%' },
    { employee: 'Morgan Patel', name: 'Quarterly Employee Retention', expectedValue: '90%', actualValue: '91%' },
    { employee: 'Riley Chen', name: 'Training Completion Rate', expectedValue: '95%', actualValue: '93%' },
  ];

  const directReportKpiTables: DirectReportKpi[] = [
    {
      employee: 'Alex Johnson',
      role: 'HR Specialist',
      kpis: [
        { name: 'Training Completion Rate', expectedValue: '95%', actualValue: '98%' },
        { name: 'Performance Review Completion', expectedValue: '100%', actualValue: '100%' },
      ],
    },
    {
      employee: 'Taylor Smith',
      role: 'Recruitment Partner',
      kpis: [
        { name: 'Time to Fill Open Roles', expectedValue: '<= 30 days', actualValue: '34 days' },
        { name: 'Quarterly Employee Retention', expectedValue: '90%', actualValue: '89%' },
      ],
    },
    {
      employee: 'Jordan Lee',
      role: 'People Operations',
      kpis: [
        { name: 'Performance Review Completion', expectedValue: '100%', actualValue: '100%' },
        { name: 'Training Completion Rate', expectedValue: '95%', actualValue: '93%' },
      ],
    },
  ];

  const myKpiPagination = paginateRows(myKpiRows, myKpiPage, myKpiRowsPerPage);
  const teamKpiPagination = paginateRows(teamKpiRows, teamKpiPage, teamKpiRowsPerPage);

  return (
    <section className="menu-page">
      <h1>KPI</h1>
      <p>Track your KPI accomplishment and review current HR KPI values.</p>

      <div className="menu-tabs">
        <button
          type="button"
          className={`menu-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My KPIs
        </button>
        {showTeamKpisTab && (
          <button
            type="button"
            className={`menu-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            My Team KPIs
          </button>
        )}
      </div>

      <div className="menu-card">
        <div className="metric-card-header">
          <h2>{activeTab === 'my' ? 'Total KPI Accomplishment' : 'Team KPI Accomplishment'}</h2>
          <strong>{activeTab === 'my' ? kpiAccomplishment : 84}%</strong>
        </div>
        <div className="metric-progress-track" aria-hidden="true">
          <div className="metric-progress-fill" style={{ width: `${activeTab === 'my' ? kpiAccomplishment : 84}%` }} />
        </div>
      </div>

      <div className="menu-card">
        <h2>{activeTab === 'my' ? 'HR KPI Details' : 'Team Overall KPIs'}</h2>
        <div className="menu-table-wrap">
          <table className="menu-table">
            <thead>
              <tr>
                {activeTab === 'team' && <th>Employee</th>}
                <th>KPI</th>
                <th>Expected Value</th>
                <th>Actual Value</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'my' && myKpiPagination.rows.map((row) => (
                <tr key={`mine-${row.name}`}>
                  <td>{row.name}</td>
                  <td>{row.expectedValue}</td>
                  <td>{row.actualValue}</td>
                </tr>
              ))}
              {activeTab === 'team' && teamKpiPagination.rows.map((row) => (
                <tr key={`${row.employee}-${row.name}`}>
                  <td>{row.employee}</td>
                  <td>{row.name}</td>
                  <td>{row.expectedValue}</td>
                  <td>{row.actualValue}</td>
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
              value={activeTab === 'my' ? myKpiRowsPerPage : teamKpiRowsPerPage}
              onChange={(event) => {
                const nextRowsPerPage = Number(event.target.value);
                if (activeTab === 'my') {
                  setMyKpiRowsPerPage(nextRowsPerPage);
                  setMyKpiPage(1);
                } else {
                  setTeamKpiRowsPerPage(nextRowsPerPage);
                  setTeamKpiPage(1);
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
              ? setMyKpiPage((page) => Math.max(1, page - 1))
              : setTeamKpiPage((page) => Math.max(1, page - 1)))}
            disabled={activeTab === 'my' ? myKpiPagination.safePage <= 1 : teamKpiPagination.safePage <= 1}
          >
            Previous
          </button>
          <span>
            Page {activeTab === 'my' ? myKpiPagination.safePage : teamKpiPagination.safePage} of{' '}
            {activeTab === 'my' ? myKpiPagination.totalPages : teamKpiPagination.totalPages}
          </span>
          <button
            type="button"
            className="menu-pagination-btn"
            onClick={() => (activeTab === 'my'
              ? setMyKpiPage((page) => Math.min(myKpiPagination.totalPages, page + 1))
              : setTeamKpiPage((page) => Math.min(teamKpiPagination.totalPages, page + 1)))}
            disabled={activeTab === 'my'
              ? myKpiPagination.safePage >= myKpiPagination.totalPages
              : teamKpiPagination.safePage >= teamKpiPagination.totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {activeTab === 'team' && (
        <div className="menu-card">
          <h2>Direct Report Individual KPIs</h2>
          <div className="menu-stacked-sections">
            {directReportKpiTables.map((report) => {
              const reportPage = directReportKpiPages[report.employee] ?? 1;
              const reportRowsPerPage = directReportKpiRowsPerPage[report.employee] ?? 5;
              const reportPagination = paginateRows(report.kpis, reportPage, reportRowsPerPage);

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
                          <th>KPI</th>
                          <th>Expected Value</th>
                          <th>Actual Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportPagination.rows.map((kpi) => (
                          <tr key={`${report.employee}-${kpi.name}`}>
                            <td>{kpi.name}</td>
                            <td>{kpi.expectedValue}</td>
                            <td>{kpi.actualValue}</td>
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
                          setDirectReportKpiRowsPerPage((previous) => ({
                            ...previous,
                            [report.employee]: nextRowsPerPage,
                          }));
                          setDirectReportKpiPages((previous) => ({
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
                      onClick={() => setDirectReportKpiPages((previous) => ({
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
                      onClick={() => setDirectReportKpiPages((previous) => ({
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
    </section>
  );
}

export default KpiPage;
