import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDot, Clock3, FileText, Plus, Star } from 'lucide-react';
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
  const { user } = useAuth();
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

  const allReviews: Review[] = cycles.map((c) => ({
    id: String(c.id),
    title: c.title,
    employee: c.reviewee_email,
    department: '',
    manager: c.reviewer_email || '',
    teammates: [],
    dueDate: formatDisplayDate(c.due_date),
    status: (c.status === 'Completed' ? 'Completed' : c.status === 'In Progress' ? 'In Progress' : 'Pending') as ReviewStatus,
  }));

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

  return (
    <section className="reviews-page">
      <div className="reviews-header-row">
        <div>
          <h1>{reviewsMockData.pageTitle}</h1>
          <p>{reviewsMockData.subtitle}</p>
        </div>
        {reviewsMockData.permissions.showCreateEvaluationButton && (
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
        {reviewsMockData.permissions.showTeamReviewsTab && (
          <button
            className={`reviews-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team Reviews
          </button>
        )}
      </div>

      <div className="reviews-list">
        {allReviews.map((review) => (
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
          type: 'text',
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
          disabled: Boolean(selectedTemplateId),
          disabledTooltip: selectedTemplateId
            ? 'Title is locked because this evaluation is using a saved template.'
            : undefined,
          helperText: selectedTemplateId
            ? 'Using a saved template. To edit title/questions, choose "None (Start from scratch)".'
            : undefined,
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
