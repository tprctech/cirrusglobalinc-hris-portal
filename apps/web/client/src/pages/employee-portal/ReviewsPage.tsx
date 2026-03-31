import { useEffect, useMemo, useState } from 'react';
import { CircleDot, Clock3, FileText, Plus, Star } from 'lucide-react';
import TemplateBuilderModal, {
  type BuilderExistingSectionOption,
  type BuilderQuestionType,
  type BuilderSection,
} from '../../components/TemplateBuilderModal';
import { useReviewCatalog } from '../../data/reviewCatalogStore';
import { reviewsMockData } from '../../data/mock/menuMockData';
import './ReviewsPage.css';

type ReviewTab = 'my' | 'team';
type ReviewStatus = 'Pending' | 'In Progress' | 'Completed';

type Review = {
  id: string;
  title: string;
  employee: string;
  manager: string;
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
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [month, day, year] = value.split('/');
  if (!month || !day || !year) {
    return '';
  }

  const normalizedMonth = month.padStart(2, '0');
  const normalizedDay = day.padStart(2, '0');
  return `${year}-${normalizedMonth}-${normalizedDay}`;
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
  const { templates, questionSets } = useReviewCatalog();
  const [activeTab, setActiveTab] = useState<ReviewTab>('my');
  const [showBuilder, setShowBuilder] = useState(false);
  const [evaluationId, setEvaluationId] = useState(nextEvaluationId);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [reviewee, setReviewee] = useState(reviewsMockData.evaluationTemplate.reviewee);
  const [dueDate, setDueDate] = useState(toIsoDate(reviewsMockData.tabs.myReviews[0]?.dueDate ?? ''));
  const [formTitle, setFormTitle] = useState(reviewsMockData.evaluationTemplate.title);
  const [sections, setSections] = useState<BuilderSection[]>(cloneSections());

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId('');
      return;
    }

    setSelectedTemplateId((previous) => {
      if (templates.some((template) => template.id === previous)) {
        return previous;
      }
      return templates[0].id;
    });
  }, [templates]);

  const existingSectionOptions = useMemo<BuilderExistingSectionOption[]>(
    () => questionSets.map((questionSet) => ({
      id: questionSet.id,
      label: questionSet.title,
      description: questionSet.description,
      section: cloneTemplateSections([questionSet.section])[0],
    })),
    [questionSets],
  );

  const reviews: Review[] = (activeTab === 'my'
    ? reviewsMockData.tabs.myReviews
    : reviewsMockData.tabs.teamReviews) as Review[];

  function openCreateEvaluationModal() {
    setEvaluationId(nextEvaluationId());
    setReviewee(reviewsMockData.evaluationTemplate.reviewee);
    setDueDate(toIsoDate(reviewsMockData.tabs.myReviews[0]?.dueDate ?? ''));

    if (templates.length) {
      const firstTemplate = templates[0];
      setSelectedTemplateId(firstTemplate.id);
      setFormTitle(firstTemplate.title);
      setSections(cloneTemplateSectionsAsLocked(
        firstTemplate.sections,
        firstTemplate.title,
        firstTemplate.description,
      ));
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

    const selectedTemplate = templates.find((template) => template.id === templateId);
    if (!selectedTemplate) {
      return;
    }

    setFormTitle(selectedTemplate.title);
    setSections(cloneTemplateSectionsAsLocked(
      selectedTemplate.sections,
      selectedTemplate.title,
      selectedTemplate.description,
    ));
  }

  function buildEvaluationPayload(): EvaluationFormPayload {
    return {
      evaluationId,
      templateId: selectedTemplateId || null,
      reviewee,
      dueDate,
      title: formTitle,
      sections: sections.map((section, sectionIndex) => ({
        id: section.id,
        order: sectionIndex + 1,
        label: section.label,
        questions: section.questions.map((question, questionIndex) => ({
          id: question.id,
          order: questionIndex + 1,
          prompt: question.prompt,
          type: question.type,
          options: [...question.options],
          required: question.required,
        })),
      })),
    };
  }

  function handleSaveTemplate() {
    const payload = buildEvaluationPayload();
    // Placeholder until backend API is connected.
    console.log('evaluation_template_payload', payload);
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
        {reviews.map((review) => (
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
            <p>Manager: <strong>{review.manager}</strong></p>
            <p>Due Date: <strong>{review.dueDate}</strong></p>

            <button className="review-employee-btn">
              <CircleDot size={15} />
              Review Employee
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
            helperText: templates.find((template) => template.id === selectedTemplateId)?.description,
            options: [
              { label: 'None (Start from scratch)', value: '' },
              ...templates.map((template) => ({
                label: template.title,
                value: template.id,
                description: template.description,
              })),
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
        saveButtonLabel="Save Evaluation"
        onSave={handleSaveTemplate}
        onClose={() => setShowBuilder(false)}
      />
    </section>
  );
}

export default ReviewsPage;
