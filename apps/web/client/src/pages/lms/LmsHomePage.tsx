import '../employee-portal/MenuPages.css';

function LmsHomePage() {
  const recentCourses = [
    { name: 'Effective 1:1 Meetings', progress: '80%', lastVisited: 'Today' },
    { name: 'Goal Setting with OKRs', progress: '40%', lastVisited: 'Yesterday' },
    { name: 'Giving Actionable Feedback', progress: '15%', lastVisited: '2 days ago' },
  ];

  return (
    <section className="menu-page">
      <h1>LMS Home</h1>
      <p>Your most recent learning activity.</p>
      <div className="menu-card">
        <h2>Your Most Recent</h2>
        <div className="menu-list">
          {recentCourses.map((course) => (
            <div key={course.name} className="menu-list-item lms-recent-item">
              <strong>{course.name}</strong>
              <span>Progress: {course.progress}</span>
              <span>Last visited: {course.lastVisited}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LmsHomePage;
