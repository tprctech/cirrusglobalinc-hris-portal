import '../employee-portal/MenuPages.css';

function LmsMyCoursesPage() {
  const myCourses = [
    { course: 'Effective 1:1 Meetings', status: 'In Progress', progress: '80%', completedOn: '-' },
    { course: 'Performance Review Essentials', status: 'Completed', progress: '100%', completedOn: 'Feb 18, 2026' },
    { course: 'Giving Actionable Feedback', status: 'Not Started', progress: '0%', completedOn: '-' },
    { course: 'Conflict Resolution at Work', status: 'Completed', progress: '100%', completedOn: 'Feb 10, 2026' },
  ];

  return (
    <section className="menu-page">
      <h1>My Courses</h1>
      <p>Track your enrolled courses and completion status.</p>
      <div className="menu-card">
        <div className="lms-table-wrap">
          <table className="lms-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Completed On</th>
              </tr>
            </thead>
            <tbody>
              {myCourses.map((course) => (
                <tr key={course.course}>
                  <td>{course.course}</td>
                  <td>{course.status}</td>
                  <td>{course.progress}</td>
                  <td>{course.completedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default LmsMyCoursesPage;
