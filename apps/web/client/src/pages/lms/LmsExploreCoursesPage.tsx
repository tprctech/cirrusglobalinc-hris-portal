import '../employee-portal/MenuPages.css';

type Course = {
  title: string;
  level: string;
  duration: string;
  category: string;
  bannerUrl?: string;
};

function buildDefaultBanner() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#007EA7" />
          <stop offset="100%" stop-color="#00A6E3" />
        </linearGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#g)" />
      <circle cx="170" cy="90" r="130" fill="rgba(255,255,255,0.12)" />
      <circle cx="1080" cy="330" r="170" fill="rgba(255,255,255,0.10)" />
      <rect x="72" y="62" width="240" height="240" rx="28" fill="rgba(255,255,255,0.20)" />
      <rect x="356" y="118" width="760" height="48" rx="16" fill="rgba(255,255,255,0.22)" />
      <rect x="356" y="194" width="620" height="40" rx="14" fill="rgba(255,255,255,0.16)" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getDifficultyClass(level: string) {
  return `lms-difficulty-badge ${level.toLowerCase()}`;
}

function LmsExploreCoursesPage() {
  const sampleCourses: Course[] = [
    { title: 'Effective 1:1 Meetings', level: 'Beginner', duration: '35 min', category: 'Management' },
    { title: 'Performance Review Essentials', level: 'Intermediate', duration: '50 min', category: 'HR' },
    { title: 'Giving Actionable Feedback', level: 'Beginner', duration: '40 min', category: 'Communication' },
    { title: 'Goal Setting with OKRs', level: 'Advanced', duration: '60 min', category: 'Strategy' },
    { title: 'Conflict Resolution at Work', level: 'Intermediate', duration: '45 min', category: 'Leadership' },
    { title: 'Building a Coaching Culture', level: 'Advanced', duration: '55 min', category: 'People Ops' },
  ];

  return (
    <section className="menu-page">
      <h1>Explore Courses</h1>
      <p>Browse sample courses while we connect live LMS content.</p>
      <div className="menu-grid">
        {sampleCourses.map((course) => (
          <article key={course.title} className="menu-card lms-course-card">
            <div className="lms-course-banner">
              <img
                src={course.bannerUrl || buildDefaultBanner()}
                alt={`${course.title} course banner`}
                onError={(event) => {
                  event.currentTarget.src = buildDefaultBanner();
                }}
              />
            </div>
            <h2>{course.title}</h2>
            <p>{course.category}</p>
            <div className="lms-course-meta">
              <span className={getDifficultyClass(course.level)}>{course.level}</span>
              <span>{course.duration}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LmsExploreCoursesPage;
