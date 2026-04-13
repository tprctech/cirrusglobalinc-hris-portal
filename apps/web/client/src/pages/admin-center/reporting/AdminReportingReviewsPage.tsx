import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Users } from 'lucide-react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import '../AdminCenterPage.css';
import './AdminReporting.css';

type ReviewCycle = {
  id: number;
  template_id: number | null;
  title: string;
  reviewee_email: string;
  reviewer_email: string;
  due_date: string | null;
  status: string;
  created_at: string | null;
};

type Question = {
  id: number;
  prompt: string;
  question_type: string;
  options: string;
  required: boolean;
  sort_order: number;
};

type Section = {
  id: number;
  label: string;
  sort_order: number;
  questions: Question[];
};

type CycleDetail = {
  id: number;
  template_id: number | null;
  title: string;
  reviewee_email: string;
  reviewer_email: string;
  due_date: string | null;
  status: string;
  sections: Section[];
};

type Answer = {
  id: number;
  question_id: number;
  section_id: number;
  answer_text: string;
  rating: number | null;
  selected_options: string;
};

type Response = {
  id: number;
  cycle_id: number;
  respondent_email: string;
  status: string;
  submitted_at: string | null;
  answers: Answer[];
};

type QuestionSummary = {
  question: Question;
  answers: Answer[];
  responseCount: number;
};

type AdminReportingReviewsPageProps = {
  onNavigate?: (path: string) => void;
};

const API = '/api/v1';

function AdminReportingReviewsPage({ onNavigate }: AdminReportingReviewsPageProps) {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [cycleDetail, setCycleDetail] = useState<CycleDetail | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'summary' | 'individual'>('summary');
  const [selectedResponseIdx, setSelectedResponseIdx] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/review-cycles`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load review cycles');
        return r.json();
      })
      .then((data) => setCycles(data))
      .catch((err) => setError(err.message || 'Failed to load review cycles'))
      .finally(() => setLoading(false));
  }, []);

  const loadCycleDetail = useCallback((cycleId: number) => {
    setSelectedCycleId(cycleId);
    setDetailLoading(true);
    setError('');
    setViewMode('summary');
    setSelectedResponseIdx(0);

    Promise.all([
      fetch(`${API}/review-cycles/${cycleId}`).then((r) => {
        if (!r.ok) throw new Error('Failed to load cycle details');
        return r.json();
      }),
      fetch(`${API}/review-cycles/${cycleId}/responses`).then((r) => {
        if (!r.ok) throw new Error('Failed to load responses');
        return r.json();
      }),
    ])
      .then(([detail, resps]: [CycleDetail, Response[]]) => {
        setCycleDetail(detail);
        setResponses(resps.filter((r) => r.status === 'Submitted'));
        const allIds = new Set(detail.sections.map((s) => s.id));
        setExpandedSections(allIds);
      })
      .catch((err) => setError(err.message || 'Failed to load report'))
      .finally(() => setDetailLoading(false));
  }, []);

  function toggleSection(sectionId: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  function getQuestionSummaries(section: Section): QuestionSummary[] {
    return section.questions.map((q) => {
      const answers = responses.flatMap((r) =>
        r.answers.filter((a) => a.question_id === q.id && a.section_id === section.id),
      );
      return { question: q, answers, responseCount: answers.length };
    });
  }

  function renderRatingSummary(summary: QuestionSummary) {
    const ratings = summary.answers.filter((a) => a.rating !== null).map((a) => a.rating!);
    if (ratings.length === 0) return <p className="reporting-no-data">No responses yet</p>;
    const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
    const dist: Record<number, number> = {};
    for (const r of ratings) dist[r] = (dist[r] || 0) + 1;
    const maxScale = Math.max(...ratings, 5);
    return (
      <div className="reporting-rating-summary">
        <div className="reporting-avg-badge">
          <span className="reporting-avg-value">{avg.toFixed(1)}</span>
          <span className="reporting-avg-label">Average ({ratings.length} responses)</span>
        </div>
        <div className="reporting-rating-bars">
          {Array.from({ length: maxScale }, (_, i) => maxScale - i).map((val) => (
            <div key={val} className="reporting-bar-row">
              <span className="reporting-bar-label">{val}</span>
              <div className="reporting-bar-track">
                <div
                  className="reporting-bar-fill"
                  style={{ width: `${((dist[val] || 0) / ratings.length) * 100}%` }}
                />
              </div>
              <span className="reporting-bar-count">{dist[val] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderMultipleChoiceSummary(summary: QuestionSummary) {
    const optionsList = summary.question.options
      ? summary.question.options.split('\n').filter(Boolean)
      : [];
    const counts: Record<string, number> = {};
    for (const opt of optionsList) counts[opt] = 0;
    for (const a of summary.answers) {
      const selected = a.selected_options ? a.selected_options.split('\n').filter(Boolean) : [];
      for (const s of selected) counts[s] = (counts[s] || 0) + 1;
    }
    const total = summary.answers.length || 1;
    if (summary.answers.length === 0) return <p className="reporting-no-data">No responses yet</p>;
    return (
      <div className="reporting-choice-summary">
        {optionsList.map((opt) => (
          <div key={opt} className="reporting-choice-row">
            <div className="reporting-choice-info">
              <span className="reporting-choice-label">{opt}</span>
              <span className="reporting-choice-pct">{Math.round((counts[opt] / total) * 100)}%</span>
            </div>
            <div className="reporting-bar-track">
              <div
                className="reporting-bar-fill choice"
                style={{ width: `${(counts[opt] / total) * 100}%` }}
              />
            </div>
            <span className="reporting-bar-count">{counts[opt]} responses</span>
          </div>
        ))}
      </div>
    );
  }

  function renderTextSummary(summary: QuestionSummary) {
    const texts = summary.answers.filter((a) => a.answer_text.trim()).map((a) => a.answer_text);
    if (texts.length === 0) return <p className="reporting-no-data">No responses yet</p>;
    return (
      <div className="reporting-text-responses">
        {texts.map((t, i) => (
          <div key={i} className="reporting-text-item">{t}</div>
        ))}
      </div>
    );
  }

  function renderQuestionSummary(summary: QuestionSummary) {
    const type = summary.question.question_type;
    if (type === 'Rating' || type === 'Scale' || type === '5-Star Rating') return renderRatingSummary(summary);
    if (type === 'Multiple Choice' || type === 'Single Choice') return renderMultipleChoiceSummary(summary);
    return renderTextSummary(summary);
  }

  function renderIndividualResponse(resp: Response) {
    if (!cycleDetail) return null;
    return (
      <div className="reporting-individual">
        <div className="reporting-individual-header">
          <strong>{resp.respondent_email}</strong>
          <span className="reporting-submitted-at">
            {resp.submitted_at ? new Date(resp.submitted_at).toLocaleDateString() : ''}
          </span>
        </div>
        {cycleDetail.sections.map((section) => (
          <div key={section.id} className="reporting-individual-section">
            <h4>{section.label}</h4>
            {section.questions.map((q) => {
              const answer = resp.answers.find(
                (a) => a.question_id === q.id && a.section_id === section.id,
              );
              return (
                <div key={q.id} className="reporting-individual-qa">
                  <p className="reporting-individual-prompt">{q.prompt}</p>
                  <p className="reporting-individual-answer">
                    {answer
                      ? answer.rating !== null
                        ? `Rating: ${answer.rating}`
                        : answer.selected_options || answer.answer_text || '—'
                      : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  const submittedResponses = responses;

  if (selectedCycleId !== null) {
    return (
      <div className="admin-center-page">
        <div className="admin-center-shell">
          <AdminCenterSidebar activeMenu="reportingReviews" onNavigate={onNavigate || (() => {})} />
          <div className="admin-center-content">
            <div className="admin-users-section">
              <div className="admin-users-toolbar">
                <div>
                  <h1 className="admin-breadcrumb-title">
                    <button
                      className="admin-breadcrumb-link"
                      onClick={() => {
                        setSelectedCycleId(null);
                        setCycleDetail(null);
                        setResponses([]);
                      }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    {cycleDetail?.title || 'Review Cycle'}
                  </h1>
                  <p>
                    {submittedResponses.length} submitted response{submittedResponses.length !== 1 ? 's' : ''}
                    {cycleDetail && ` | Reviewee: ${cycleDetail.reviewee_email}`}
                    {cycleDetail?.due_date && ` | Due: ${cycleDetail.due_date}`}
                  </p>
                </div>
              </div>

              {error && <p className="reporting-error">{error}</p>}
              {detailLoading && <p className="reporting-loading">Loading report...</p>}

              {!detailLoading && !error && cycleDetail && (
                <>
                  <div className="reporting-view-toggle">
                    <button
                      className={`admin-tab-btn ${viewMode === 'summary' ? 'active' : ''}`}
                      onClick={() => setViewMode('summary')}
                    >
                      Summary
                    </button>
                    <button
                      className={`admin-tab-btn ${viewMode === 'individual' ? 'active' : ''}`}
                      onClick={() => setViewMode('individual')}
                    >
                      Individual
                    </button>
                  </div>

                  {viewMode === 'summary' && (
                    <div className="reporting-sections">
                      {cycleDetail.sections.map((section) => {
                        const summaries = getQuestionSummaries(section);
                        const isExpanded = expandedSections.has(section.id);
                        return (
                          <div key={section.id} className="reporting-section">
                            <button
                              className="reporting-section-header"
                              onClick={() => toggleSection(section.id)}
                            >
                              <span className="reporting-section-title">{section.label}</span>
                              <span className="reporting-section-count">
                                {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                              </span>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            {isExpanded && (
                              <div className="reporting-questions">
                                {summaries.map((s, idx) => (
                                  <div key={s.question.id} className="reporting-question-card">
                                    <div className="reporting-question-header">
                                      <span className="reporting-question-number">Q{idx + 1}</span>
                                      <span className="reporting-question-prompt">{s.question.prompt}</span>
                                      <span className="reporting-question-type">{s.question.question_type}</span>
                                    </div>
                                    <div className="reporting-question-body">
                                      {renderQuestionSummary(s)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {cycleDetail.sections.length === 0 && (
                        <p className="reporting-no-data">No sections found for this review cycle.</p>
                      )}
                    </div>
                  )}

                  {viewMode === 'individual' && (
                    <div className="reporting-individual-view">
                      {submittedResponses.length === 0 && (
                        <p className="reporting-no-data">No submitted responses yet.</p>
                      )}
                      {submittedResponses.length > 0 && (
                        <>
                          <div className="reporting-response-nav">
                            <button
                              className="admin-pagination-btn"
                              disabled={selectedResponseIdx <= 0}
                              onClick={() => setSelectedResponseIdx((i) => i - 1)}
                            >
                              Previous
                            </button>
                            <span className="reporting-response-counter">
                              {selectedResponseIdx + 1} of {submittedResponses.length}
                            </span>
                            <button
                              className="admin-pagination-btn"
                              disabled={selectedResponseIdx >= submittedResponses.length - 1}
                              onClick={() => setSelectedResponseIdx((i) => i + 1)}
                            >
                              Next
                            </button>
                          </div>
                          {renderIndividualResponse(submittedResponses[selectedResponseIdx])}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="reportingReviews" onNavigate={onNavigate || (() => {})} />
        <div className="admin-center-content">
          <div className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Review Reporting</h1>
                <p>Select a review cycle to view collected responses.</p>
              </div>
            </div>

            {error && <p className="reporting-error">{error}</p>}
            {loading && <p className="reporting-loading">Loading review cycles...</p>}

            {!loading && !error && cycles.length === 0 && (
              <div className="reporting-empty-state">
                <Users size={40} />
                <p>No review cycles found. Create review cycles from the employee portal to start collecting responses.</p>
              </div>
            )}

            {!loading && !error && cycles.length > 0 && (
              <div className="reporting-cycle-grid">
                {cycles.map((cycle) => (
                  <button
                    key={cycle.id}
                    className="reporting-cycle-card"
                    onClick={() => loadCycleDetail(cycle.id)}
                  >
                    <div className="reporting-cycle-title">{cycle.title}</div>
                    <div className="reporting-cycle-meta">
                      <span>Reviewee: {cycle.reviewee_email}</span>
                      {cycle.due_date && <span>Due: {cycle.due_date}</span>}
                    </div>
                    <div className="reporting-cycle-footer">
                      <span className={`reporting-status-badge ${cycle.status.toLowerCase()}`}>
                        {cycle.status}
                      </span>
                      {cycle.created_at && (
                        <span className="reporting-cycle-date">
                          Created {new Date(cycle.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReportingReviewsPage;
