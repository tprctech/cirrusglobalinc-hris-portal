import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import AdminCenterSidebar from '../../components/AdminCenterSidebar';
import AdminTablePagination from '../../components/AdminTablePagination';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import './AdminCenterPage.css';

type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

type AdminLmsCourse = {
  id: string;
  title: string;
  category: string;
  level: CourseLevel;
  duration: string;
  bannerUrl: string;
};

type AdminLmsCoursesPageProps = {
  onNavigate?: (path: string) => void;
};

const PAGE_SIZE = 8;
const levelOptions: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const initialCourses: AdminLmsCourse[] = [
  {
    id: 'course-1',
    title: 'Effective 1:1 Meetings',
    category: 'Management',
    level: 'Beginner',
    duration: '35 min',
    bannerUrl: '',
  },
  {
    id: 'course-2',
    title: 'Performance Review Essentials',
    category: 'HR',
    level: 'Intermediate',
    duration: '50 min',
    bannerUrl: '',
  },
  {
    id: 'course-3',
    title: 'Giving Actionable Feedback',
    category: 'Communication',
    level: 'Beginner',
    duration: '40 min',
    bannerUrl: '',
  },
  {
    id: 'course-4',
    title: 'Goal Setting with OKRs',
    category: 'Strategy',
    level: 'Advanced',
    duration: '60 min',
    bannerUrl: '',
  },
];

function createEmptyForm(): Omit<AdminLmsCourse, 'id'> {
  return {
    title: '',
    category: '',
    level: 'Beginner',
    duration: '',
    bannerUrl: '',
  };
}

function AdminLmsCoursesPage({ onNavigate }: AdminLmsCoursesPageProps) {
  const [courses, setCourses] = useState<AdminLmsCourse[]>(initialCourses);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<Omit<AdminLmsCourse, 'id'>>(createEmptyForm());
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<AdminLmsCourse | null>(null);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const filteredCourses = useMemo(() => {
    const searchText = courseSearchTerm.trim().toLowerCase();
    if (!searchText) {
      return courses;
    }

    return courses.filter((course) => (
      `${course.title} ${course.category} ${course.level} ${course.duration} ${course.bannerUrl}`
        .toLowerCase()
        .includes(searchText)
    ));
  }, [courseSearchTerm, courses]);

  const totalCourses = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCourses = filteredCourses.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  function openCreateCourseModal() {
    setEditingCourseId(null);
    setCourseForm(createEmptyForm());
    setShowCourseModal(true);
  }

  function openEditCourseModal(course: AdminLmsCourse) {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      category: course.category,
      level: course.level,
      duration: course.duration,
      bannerUrl: course.bannerUrl,
    });
    setShowCourseModal(true);
  }

  function updateCourseFormField(field: keyof Omit<AdminLmsCourse, 'id'>, value: string) {
    setCourseForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSaveCourse() {
    if (!courseForm.title.trim() || !courseForm.category.trim() || !courseForm.duration.trim()) {
      return;
    }

    if (editingCourseId) {
      const updatedCourse: AdminLmsCourse = {
        id: editingCourseId,
        ...courseForm,
        title: courseForm.title.trim(),
        category: courseForm.category.trim(),
        duration: courseForm.duration.trim(),
        bannerUrl: courseForm.bannerUrl.trim(),
      };
      console.log('admin_lms_edit_course_payload', { courseId: editingCourseId, course: updatedCourse });
      setCourses((previous) => previous.map((course) => (
        course.id === editingCourseId ? updatedCourse : course
      )));
    } else {
      const newCourse: AdminLmsCourse = {
        id: `course-${Date.now()}`,
        ...courseForm,
        title: courseForm.title.trim(),
        category: courseForm.category.trim(),
        duration: courseForm.duration.trim(),
        bannerUrl: courseForm.bannerUrl.trim(),
      };
      console.log('admin_lms_create_course_payload', { course: newCourse });
      setCourses((previous) => [...previous, newCourse]);
    }

    setShowCourseModal(false);
    setEditingCourseId(null);
    setCourseForm(createEmptyForm());
  }

  function handleDeleteCourse(courseId: string) {
    console.log('admin_lms_delete_course_payload', { courseId });
    setCourses((previous) => previous.filter((course) => course.id !== courseId));
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="lms" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>LMS</h1>
                <p>Manage LMS courses used by the employee Explore Courses page.</p>
              </div>
              <button className="admin-invite-btn" onClick={openCreateCourseModal}>
                <Plus size={16} />
                Add Course
              </button>
            </div>

            <div className="admin-users-filters">
              <input
                value={courseSearchTerm}
                onChange={(event) => {
                  setCourseSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search courses by title, category, level, duration..."
              />
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Category</th>
                    <th>Difficulty Level</th>
                    <th>Duration</th>
                    <th>Banner URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCourses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-empty-state">
                        No courses found for the current filter.
                      </td>
                    </tr>
                  )}
                  {pagedCourses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.title}</td>
                      <td>{course.category}</td>
                      <td>{course.level}</td>
                      <td>{course.duration}</td>
                      <td>{course.bannerUrl || '-'}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-edit-btn" onClick={() => openEditCourseModal(course)}>
                            Edit
                          </button>
                          <button className="admin-delete-btn" onClick={() => setPendingDeleteCourse(course)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminTablePagination
              currentPage={safeCurrentPage}
              totalItems={totalCourses}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
      </div>

      {showCourseModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>{editingCourseId ? 'Edit Course' : 'Add Course'}</h3>
                <p>Manage LMS course details shown in Explore Courses.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowCourseModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-edit-grid">
              <div className="admin-form-field">
                <label htmlFor="course-title">Course Title</label>
                <input
                  id="course-title"
                  value={courseForm.title}
                  onChange={(event) => updateCourseFormField('title', event.target.value)}
                  placeholder="Effective 1:1 Meetings"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="course-category">Category</label>
                <input
                  id="course-category"
                  value={courseForm.category}
                  onChange={(event) => updateCourseFormField('category', event.target.value)}
                  placeholder="Management"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="course-level">Difficulty Level</label>
                <select
                  id="course-level"
                  value={courseForm.level}
                  onChange={(event) => updateCourseFormField('level', event.target.value as CourseLevel)}
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="course-duration">Duration</label>
                <input
                  id="course-duration"
                  value={courseForm.duration}
                  onChange={(event) => updateCourseFormField('duration', event.target.value)}
                  placeholder="45 min"
                />
              </div>
              <div className="admin-form-field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="course-banner-url">Banner Image URL (optional)</label>
                <input
                  id="course-banner-url"
                  value={courseForm.bannerUrl}
                  onChange={(event) => updateCourseFormField('bannerUrl', event.target.value)}
                  placeholder="https://example.com/course-banner.jpg"
                />
                <small>Leave blank to use the default banner image.</small>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowCourseModal(false)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleSaveCourse}>
                {editingCourseId ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </section>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteCourse)}
        title="Delete Course"
        message={`Are you sure you want to delete "${pendingDeleteCourse?.title ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteCourse(null)}
        onConfirm={() => {
          if (pendingDeleteCourse) {
            handleDeleteCourse(pendingDeleteCourse.id);
          }
          setPendingDeleteCourse(null);
        }}
      />
    </section>
  );
}

export default AdminLmsCoursesPage;
