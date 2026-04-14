import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, CircleDot, Clock3, FileText, Plus, Star } from 'lucide-react';
import TemplateBuilderModal, {
  type BuilderExistingSectionOption,
  type BuilderQuestionType,
  type BuilderSection,
} from '../../components/TemplateBuilderModal';
import FormResponseModal, {
  type AnswerValue,
  type FormResponseData,
  type ResponseSection,
} from '../../components/FormResponseModal';
import { useReviewCatalog } from '../../data/reviewCatalogStore';
import { useAuth } from '../../app/AuthContext';
import { reviewsMockData } from '../../data/mock/menuMockData';
import './ReviewsPage.css';
import '../../pages/admin-center/reporting/AdminReporting.css';

const API_BASE = '/api/v1';

type ReviewTab = 'my' | 'team';
type ReviewStatus = 'Pending' | 'In Progress' | 'Completed';

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

type CycleDetail = {
  id: number;
  template_id: number | null;
  title: string;
  reviewee_email: string;
  reviewer_email: string;
  due_date: string | null;
  status: string;
  sections: Array<{
    id: number;
    label: string;
    sort_order: number;
    questions: Array<{
      id: number;
      prompt: string;
      question_type: string;
      options: string;
      required: boolean;
      sort_order: number;
    }>;
  }>;
};

type Review = {
  id: string;
  title: string;
  employee: string;
  department: string;
  manager: string;
  teammates: string[];
  dueDate: string;
  status: ReviewStatus;
};

type EvaluationFormPayload = {
  evaluationId: string;
  templateId: string | null;
  reviewee: string;
  dueDate: string;
  title: string;
  sections: Array<{
    id: string;
    order: number;
    label: string;
    questions: Array<{
      id: string;
      order: number;
      prompt: string;
      type: BuilderQuestionType;
      options: string[];
      required: boolean;
    }>;
  }>;
};

type TeamAnswer = {
  id: number;
  question_id: number;
  section_id: number;
  answer_text: string;
  rating: number | null;
  selected_options: string;
};

type TeamResponse = {
  id: number;
  cycle_id: number;
  respondent_email: string;
  status: string;
  submitted_at: string | null;
  answers: TeamAnswer[];
};

type TeamQuestionSummary = {
  question: CycleDetail['sections'][0]['questions'][0];
  answers: TeamAnswer[];
  responseCount: number;
};

let evaluationCounter = 0;

function nextEvaluationId() {
  evaluationCounter += 1;
  return `evaluation-${evaluationCounter}`;
}

const statusClassMap: Record<ReviewStatus, string> = {
  Pending: 'status-badge pending',
  'In Progress': 'status-badge in-progress',
  Completed: 'status-badge completed',
};

function toIsoDate(value: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [month, day, year] = value.split('/');
  if (!month || !day || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return 'TBD';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${Number(month)}/${Number(day)}/${year}`;
}

function cloneSections(): BuilderSection[] {
  return reviewsMockData.evaluationTemplate.sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => ({
      ...question,
      type: question.type as BuilderQuestionType,
      options: [...question.options],
      required: 'required' in question ? Boolean(question.required) : false,
    })),
  }));
}

function cloneTemplateSections(sections: BuilderSection[]): BuilderSection[] {
  return sections.map((section) => ({
    id: section.id,
    label: section.label,
    isReadOnly: section.isReadOnly ?? false,
    readOnlyReason: section.readOnlyReason,
    sourceTitle: section.sourceTitle,
    sourceDescription: section.sourceDescription,
    sourceQuestionSetId: section.sourceQuestionSetId,
    questions: section.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      options: [...question.options],
      required: question.required ?? false,
    })),
  }));
}

function cloneTemplateSectionsAsLocked(
  sections: BuilderSection[],
  sourceTitle: string,
  sourceDescription: string,
): BuilderSection[] {
  return sections.map((section) => ({
    ...cloneTemplateSections([section])[0],
    isReadOnly: true,
    readOnlyReason: 'This section comes from a template and cannot be edited.',
    sourceTitle,
    sourceDescription,
  }));
}

function ReviewsPage() {
  const { user, hasRole } = useAuth();
  const { templates, questionSets } = useReviewCatalog();
  const [activeTab, setActiveTab] = useState<ReviewTab>('my');
  const [showBuilder, setShowBuilder] = useState(false);
  const [evaluationId, setEvaluationId] = useState(nextEvaluationId);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [reviewee, setReviewee] = useState(reviewsMockData.evaluationTemplate.reviewee);
  const [dueDate, setDueDate] = useState(toIsoDate(reviewsMockData.tabs.myReviews[0]?.dueDate ?? ''));
  const [formTitle, setFormTitle] = useState(reviewsMockData.evaluationTemplate.title);
  const [sections, setSections] = useState<BuilderSection[]>(cloneSections());

  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [activeCycleDetail, setActiveCycleDetail] = useState<CycleDetail | null>(null);
  const [existingAnswers, setExistingAnswers] = useState<AnswerValue[]>([]);
  const [responseSaving, setResponseSaving] = useState(false);
  const [creatingCycle, setCreatingCycle] = useState(false);

  const [directReportEmails, setDirectReportEmails] = useState<string[]>([]);
  const [hasDirectReports, setHasDirectReports] = useState(false);

  const [teamSelectedCycleId, setTeamSelectedCycleId] = useState<number | null>(null);
  const [teamCycleDetail, setTeamCycleDetail] = useState<CycleDetail | null>(null);
  const [teamResponses, setTeamResponses] = useState<TeamResponse[]>([]);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);
  const [teamExpandedSections, setTeamExpandedSections] = useState<Set<number>>(new Set());
  const [teamViewMode, setTeamViewMode] = useState<'summary' | 'individual'>('summary');
  const [teamSelectedResponseIdx, setTeamSelectedResponseIdx] = useState(0);

  const isPrivileged = hasRole('Admin', 'HR');

  useEffect(() => {
    if (!user?.employee?.email) return;
    const empEmail = user.employee.email.toLowerCase();
    fetch('/api/v1/hr/employees/')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { supervisor?: string; email?: string; status?: string }[]) => {
        const reportEmails = data
          .filter((e) => {
            if (e.status !== 'Active' || !e.supervisor) return false;
            const sv = e.supervisor.toLowerCase().trim();
            const emailOnly = sv.includes('(') ? (sv.match(/\(([^)]+)\)/)?.[1] || sv) : sv;
            return emailOnly === empEmail;
          })
          .map((e) => (e.email || '').toLowerCase())
          .filter(Boolean);
        setDirectReportEmails(reportEmails);
        setHasDirectReports(reportEmails.length > 0);
      })
      .catch(() => {});
  }, [user?.employee?.email]);

  const showTeamTab = hasDirectReports || isPrivileged;
  const showCreateButton = hasDirectReports || isPrivileged;

  const loadCycles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/review-cycles`);
      if (res.ok) setCycles(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCycles(); }, [loadCycles]);

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId('');
      return;
    }
    setSelectedTemplateId((prev) => templates.some((t) => t.id === prev) ? prev : templates[0].id);
  }, [templates]);

  const existingSectionOptions = useMemo<BuilderExistingSectionOption[]>(
    () => questionSets.map((qs) => ({
      id: qs.id,
      label: qs.title,
      description: qs.description,
      section: cloneTemplateSections([qs.section])[0],
    })),
    [questionSets],
  );

  const myEmail = (user?.email || '').toLowerCase();

  const myReviews: Review[] = cycles
    .filter((c) => c.reviewee_email.toLowerCase() === myEmail)
    .map((c) => ({
      id: String(c.id),
      title: c.title,
      employee: c.reviewee_email,
      department: '',
      manager: c.reviewer_email || '',
      teammates: [],
      dueDate: formatDisplayDate(c.due_date),
      status: (c.status === 'Completed' ? 'Completed' : c.status === 'In Progress' ? 'In Progress' : 'Pending') as ReviewStatus,
    }));

  const teamCycles = useMemo(() => {
    if (isPrivileged) {
      return cycles.filter((c) => c.reviewee_email.toLowerCase() !== myEmail);
    }
    return cycles.filter((c) => directReportEmails.includes(c.reviewee_email.toLowerCase()));
  }, [cycles, directReportEmails, myEmail, isPrivileged]);

  function openCreateEvaluationModal() {
    setEvaluationId(nextEvaluationId());
    setReviewee(reviewsMockData.evaluationTemplate.reviewee);
    setDueDate(toIsoDate(reviewsMockData.tabs.myReviews[0]?.dueDate ?? ''));
    if (templates.length) {
      const first = templates[0];
      setSelectedTemplateId(first.id);
      setFormTitle(first.title);
      setSections(cloneTemplateSectionsAsLocked(first.sections, first.title, first.description));
    } else {
      setSelectedTemplateId('');
      setFormTitle(reviewsMockData.evaluationTemplate.title);
      setSections(cloneSections());
    }
    setShowBuilder(true);
  }

  function handleTemplateSelection(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setFormTitle(reviewsMockData.evaluationTemplate.title);
      setSections(cloneSections());
      return;
    }
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setFormTitle(tmpl.title);
    setSections(cloneTemplateSectionsAsLocked(tmpl.sections, tmpl.title, tmpl.description));
  }

  async function handleSaveTemplate() {
    if (creatingCycle) return;
    setCreatingCycle(true);
    try {
      const templateDbId = selectedTemplateId ? Number(selectedTemplateId) : null;
      const res = await fetch(`${API_BASE}/review-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateDbId,
          title: formTitle,
          reviewee_email: reviewee,
          reviewer_email: user?.email ?? '',
          due_date: dueDate || null,
        }),
      });
      if (res.ok) {
        setShowBuilder(false);
        await loadCycles();
      }
    } catch (err) {
      console.error('Failed to create review cycle', err);
    } finally {
      setCreatingCycle(false);
    }
  }

  async function openResponseForm(reviewId: string) {
    const cycleId = Number(reviewId);
    if (Number.isNaN(cycleId)) return;
    try {
      const res = await fetch(`${API_BASE}/review-cycles/${cycleId}`);
      if (!res.ok) return;
      const detail: CycleDetail = await res.json();
      setActiveCycleDetail(detail);

      const respRes = await fetch(`${API_BASE}/review-cycles/${cycleId}/responses`);
      if (respRes.ok) {
        const responses = await respRes.json();
        const myResponse = responses.find((r: any) => r.respondent_email === (user?.email ?? ''));
        if (myResponse) {
          setExistingAnswers(
            myResponse.answers.map((a: any) => ({
              questionId: a.question_id,
              sectionId: a.section_id,
              answerText: a.answer_text ?? '',
              rating: a.rating ?? null,
              selectedOptions: a.selected_options ? a.selected_options.split('\n').filter(Boolean) : [],
            })),
          );
        } else {
          setExistingAnswers([]);
        }
      }
      setShowResponseForm(true);
    } catch (err) {
      console.error('Failed to load review cycle', err);
    }
  }

  function buildResponseSections(): ResponseSection[] {
    if (!activeCycleDetail) return [];
    return activeCycleDetail.sections.map((sec) => ({
      sectionId: sec.id,
      label: sec.label,
      questions: sec.questions.map((q) => ({
        questionId: q.id,
        sectionId: sec.id,
        prompt: q.prompt,
        type: q.question_type as any,
        options: q.options ? q.options.split('\n').filter(Boolean) : [],
        required: q.required,
      })),
    }));
  }

  async function handleSaveResponse(data: FormResponseData) {
    if (!activeCycleDetail || responseSaving) return;
    setResponseSaving(true);
    try {
      const res = await fetch(`${API_BASE}/review-cycles/${activeCycleDetail.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_email: user?.email ?? '',
          status: data.status,
          answers: data.answers.map((a) => ({
            question_id: a.questionId,
            section_id: a.sectionId,
            answer_text: a.answerText,
            rating: a.rating,
            selected_options: a.selectedOptions.join('\n'),
          })),
        }),
      });
      if (res.ok) {
        setShowResponseForm(false);
        await loadCycles();
      }
    } catch (err) {
      console.error('Failed to save review response', err);
    } finally {
      setResponseSaving(false);
    }
  }

  const loadTeamCycleDetail = useCallback((cycleId: number) => {
    setTeamSelectedCycleId(cycleId);
    setTeamDetailLoading(true);
    setTeamViewMode('summary');
    setTeamSelectedResponseIdx(0);

    Promise.all([
      fetch(`${API_BASE}/review-cycles/${cycleId}`).then((r) => r.json()),
      fetch(`${API_BASE}/review-cycles/${cycleId}/responses`).then((r) => r.json()),
    ])
      .then(([detail, resps]: [CycleDetail, TeamResponse[]]) => {
        setTeamCycleDetail(detail);
        setTeamResponses(resps.filter((r) => r.status === 'Submitted'));
        setTeamExpandedSections(new Set(detail.sections.map((s) => s.id)));
      })
      .catch(() => {})
      .finally(() => setTeamDetailLoading(false));
  }, []);

  function toggleTeamSection(sectionId: number) {
    setTeamExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  function getTeamQuestionSummaries(section: CycleDetail['sections'][0]): TeamQuestionSummary[] {
    return section.questions.map((q) => {
      const answers = teamResponses.flatMap((r) =>
        r.answers.filter((a) => a.question_id === q.id && a.section_id === section.id),
      );
      return { question: q, answers, responseCount: answers.length };
    });
  }

  function renderTeamRatingSummary(summary: TeamQuestionSummary) {
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

  function renderTeamChoiceSummary(summary: TeamQuestionSummary) {
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

  function renderTeamTextSummary(summary: TeamQuestionSummary) {
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

  function renderTeamQuestionSummary(summary: TeamQuestionSummary) {
    const type = summary.question.question_type;
    if (type === 'Rating' || type === 'Scale' || type === '5-Star Rating') return renderTeamRatingSummary(summary);
    if (type === 'Multiple Choice' || type === 'Single Choice') return renderTeamChoiceSummary(summary);
    return renderTeamTextSummary(summary);
  }

  function renderTeamIndividualResponse(resp: TeamResponse) {
    if (!teamCycleDetail) return null;
    return (
      <div className="reporting-individual">
        <div className="reporting-individual-header">
          <strong>{resp.respondent_email}</strong>
          <span className="reporting-submitted-at">
            {resp.submitted_at ? new Date(resp.submitted_at).toLocaleDateString() : ''}
          </span>
        </div>
        {teamCycleDetail.sections.map((section) => (
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

  function renderTeamReviewsContent() {
    if (teamSelectedCycleId !== null) {
      const submittedResponses = teamResponses;
      return (
        <div className="team-review-report">
          <div className="team-report-toolbar">
            <div>
              <h2 className="team-report-title">
                <button
                  className="team-report-back-btn"
                  onClick={() => {
                    setTeamSelectedCycleId(null);
                    setTeamCycleDetail(null);
                    setTeamResponses([]);
                  }}
                >
                  <ArrowLeft size={16} />
                </button>
                {teamCycleDetail?.title || 'Review Cycle'}
              </h2>
              <p className="team-report-subtitle">
                {submittedResponses.length} submitted response{submittedResponses.length !== 1 ? 's' : ''}
                {teamCycleDetail && ` · Reviewee: ${teamCycleDetail.reviewee_email}`}
                {teamCycleDetail?.due_date && ` · Due: ${teamCycleDetail.due_date}`}
              </p>
            </div>
          </div>

          {teamDetailLoading && <p className="reporting-loading">Loading report...</p>}

          {!teamDetailLoading && teamCycleDetail && (
            <>
              <div className="reporting-view-toggle">
                <button
                  className={`reviews-tab ${teamViewMode === 'summary' ? 'active' : ''}`}
                  onClick={() => setTeamViewMode('summary')}
                >
                  Summary
                </button>
                <button
                  className={`reviews-tab ${teamViewMode === 'individual' ? 'active' : ''}`}
                  onClick={() => setTeamViewMode('individual')}
                >
                  Individual
                </button>
              </div>

              {teamViewMode === 'summary' && (
                <div className="reporting-sections">
                  {teamCycleDetail.sections.map((section) => {
                    const summaries = getTeamQuestionSummaries(section);
                    const isExpanded = teamExpandedSections.has(section.id);
                    return (
                      <div key={section.id} className="reporting-section">
                        <button
                          className="reporting-section-header"
                          onClick={() => toggleTeamSection(section.id)}
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
                                  {renderTeamQuestionSummary(s)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {teamCycleDetail.sections.length === 0 && (
                    <p className="reporting-no-data">No sections found for this review cycle.</p>
                  )}
                </div>
              )}

              {teamViewMode === 'individual' && (
                <div className="reporting-individual-view">
                  {submittedResponses.length === 0 && (
                    <p className="reporting-no-data">No submitted responses yet.</p>
                  )}
                  {submittedResponses.length > 0 && (
                    <>
                      <div className="reporting-response-nav">
                        <button
                          className="team-report-nav-btn"
                          disabled={teamSelectedResponseIdx <= 0}
                          onClick={() => setTeamSelectedResponseIdx((i) => i - 1)}
                        >
                          Previous
                        </button>
                        <span className="reporting-response-counter">
                          {teamSelectedResponseIdx + 1} of {submittedResponses.length}
                        </span>
                        <button
                          className="team-report-nav-btn"
                          disabled={teamSelectedResponseIdx >= submittedResponses.length - 1}
                          onClick={() => setTeamSelectedResponseIdx((i) => i + 1)}
                        >
                          Next
                        </button>
                      </div>
                      {renderTeamIndividualResponse(submittedResponses[teamSelectedResponseIdx])}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <>
        {teamCycles.length === 0 && (
          <div className="reviews-empty-state">
            <FileText size={36} />
            <p>No team review cycles found yet.</p>
          </div>
        )}
        <div className="reporting-cycle-grid">
          {teamCycles.map((cycle) => (
            <button
              key={cycle.id}
              className="reporting-cycle-card"
              onClick={() => loadTeamCycleDetail(cycle.id)}
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
      </>
    );
  }

  return (
    <section className="reviews-page">
      <div className="reviews-header-row">
        <div>
          <h1>{reviewsMockData.pageTitle}</h1>
          <p>{reviewsMockData.subtitle}</p>
        </div>
        {showCreateButton && (
          <button className="create-evaluation-btn" onClick={openCreateEvaluationModal}>
            <Plus size={16} />
            Create Evaluation
          </button>
        )}
      </div>

      <div className="reviews-tabs">
        <button
          className={`reviews-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My Reviews
        </button>
        {showTeamTab && (
          <button
            className={`reviews-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team Reviews
          </button>
        )}
      </div>

      {activeTab === 'my' && (
        <div className="reviews-list">
          {myReviews.length === 0 && (
            <div className="reviews-empty-state">
              <FileText size={36} />
              <p>No reviews assigned to you yet.</p>
            </div>
          )}
          {myReviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card-header">
                <div className="review-title-row">
                  <FileText size={18} />
                  <h3>{review.title}</h3>
                </div>
                <span className={statusClassMap[review.status]}>
                  {(review.status === 'Pending' || review.status === 'In Progress') && <Clock3 size={14} />}
                  {review.status === 'Completed' && <Star size={14} />}
                  {review.status}
                </span>
              </div>

              <p>Employee: <strong>{review.employee}</strong></p>
              {review.department && <p>Department: <strong>{review.department}</strong></p>}
              {review.manager && <p>Manager: <strong>{review.manager}</strong></p>}
              {review.teammates.length > 0 && <p>Teammates: <strong>{review.teammates.join(', ')}</strong></p>}
              <p>Due Date: <strong>{review.dueDate}</strong></p>

              <button
                className="review-employee-btn"
                onClick={() => openResponseForm(review.id)}
              >
                <CircleDot size={15} />
                {review.status === 'Completed' ? 'View Response' : 'Review Employee'}
              </button>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'team' && showTeamTab && renderTeamReviewsContent()}

      <TemplateBuilderModal
        isOpen={showBuilder}
        templateId={evaluationId}
        templateEntity="evaluation-template"
        modalTitle="Create Performance Evaluation Form"
        modalDescription="Select a reusable template, then customize sections and questions for this evaluation."
        metaFields={[
          {
            id: 'evaluation-template-select',
            label: 'Review Template',
            name: 'templateId',
            dataField: 'templateId',
            value: selectedTemplateId,
            onChange: handleTemplateSelection,
            type: 'select',
            helperText: templates.find((t) => t.id === selectedTemplateId)?.description,
            options: [
              { label: 'None (Start from scratch)', value: '' },
              ...templates.map((t) => ({ label: t.title, value: t.id, description: t.description })),
            ],
          },
        ]}
        subjectField={{
          id: 'evaluation-reviewee',
          label: 'Reviewee',
          name: 'reviewee',
          dataField: 'reviewee',
          value: reviewee,
          onChange: setReviewee,
          type: 'user-search',
          placeholder: 'Search by name or email...',
        }}
        afterSubjectFields={[
          {
            id: 'evaluation-due-date',
            label: 'Due Date',
            name: 'dueDate',
            dataField: 'dueDate',
            value: dueDate,
            onChange: setDueDate,
            type: 'date',
          },
        ]}
        titleField={{
          id: 'evaluation-title',
          label: 'Evaluation Title',
          name: 'title',
          dataField: 'title',
          value: formTitle,
          onChange: setFormTitle,
        }}
        sections={sections}
        setSections={setSections}
        existingSectionOptions={existingSectionOptions}
        saveButtonLabel={creatingCycle ? 'Saving...' : 'Save Evaluation'}
        onSave={handleSaveTemplate}
        onClose={() => setShowBuilder(false)}
      />

      <FormResponseModal
        isOpen={showResponseForm}
        title={activeCycleDetail?.title ?? 'Review'}
        description="Complete the evaluation by answering each question below."
        meta={[
          { label: 'Reviewee', value: activeCycleDetail?.reviewee_email ?? '' },
          { label: 'Due Date', value: formatDisplayDate(activeCycleDetail?.due_date ?? null) },
          { label: 'Status', value: activeCycleDetail?.status ?? '' },
        ]}
        sections={buildResponseSections()}
        existingAnswers={existingAnswers}
        readOnly={activeCycleDetail?.status === 'Completed'}
        saving={responseSaving}
        onSaveDraft={(data) => handleSaveResponse(data)}
        onSubmit={(data) => handleSaveResponse(data)}
        onClose={() => setShowResponseForm(false)}
      />
    </section>
  );
}

export default ReviewsPage;
