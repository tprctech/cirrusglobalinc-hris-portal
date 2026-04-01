import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CircleDot, Pencil, Plus, Trash2 } from 'lucide-react';
import TemplateBuilderModal, {
  type BuilderExistingSectionOption,
  type BuilderQuestionType,
  type BuilderSection,
} from '../../components/TemplateBuilderModal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { surveysMockData } from '../../data/mock/menuMockData';
import { useSurveyCatalog } from '../../data/surveyCatalogStore';
import './SurveysPage.css';

type SurveyTab = 'active' | 'my';
type SurveyStatus = 'Draft' | 'Active' | 'Inactive' | 'Completed';
type SurveyScope = 'All Employees' | 'My Department';

type ActiveSurvey = {
  id: string;
  title: string;
  audience: string;
  dueDate: string;
  estimatedTime: string;
  questionCount: number;
  status: 'Active';
};

type ManagedSurvey = {
  id: string;
  title: string;
  audience: string;
  department: string;
  createdDate: string;
  dueDate: string;
  status: SurveyStatus;
  responseCount: number;
  questionCount: number;
};

type SurveyTemplatePayload = {
  templateId: string | null;
  scope: SurveyScope;
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

const statusClassMap: Record<SurveyStatus, string> = {
  Draft: 'survey-status-badge draft',
  Active: 'survey-status-badge active',
  Inactive: 'survey-status-badge inactive',
  Completed: 'survey-status-badge completed',
};

function cloneSections(): BuilderSection[] {
  return surveysMockData.surveyTemplate.sections.map((section) => ({
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
    readOnlyReason: 'This section comes from a template and questions cannot be edited or deleted.',
    sourceTitle,
    sourceDescription,
  }));
}

function buildSectionsFromTemplate(template: SurveyTemplatePayload): BuilderSection[] {
  return template.sections.map((section) => ({
    id: section.id,
    label: section.label,
    questions: section.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      options: [...question.options],
      required: question.required ?? false,
    })),
  }));
}

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US');
}

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

function toUsDate(value: string): string {
  if (!value) {
    return 'TBD';
  }

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return value;
  }

  return `${Number(month)}/${Number(day)}/${year}`;
}

function getAudienceFromScope(scope: SurveyScope): string {
  return scope;
}

function getScopeFromAudience(audience: string): SurveyScope {
  return audience === 'All Employees' ? 'All Employees' : 'My Department';
}

function SurveysPage() {
  const { templates, questionSets } = useSurveyCatalog();
  const [activeTab, setActiveTab] = useState<SurveyTab>('active');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  const [managedSurveys, setManagedSurveys] = useState<ManagedSurvey[]>(
    surveysMockData.tabs.mySurveys as ManagedSurvey[],
  );
  const [surveyTemplatesById, setSurveyTemplatesById] = useState<Record<string, SurveyTemplatePayload>>({});
  const [templateId, setTemplateId] = useState(`survey-template-${Date.now()}`);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [scope, setScope] = useState<SurveyScope>(surveysMockData.surveyTemplate.scope as SurveyScope);
  const [dueDate, setDueDate] = useState(toIsoDate(surveysMockData.tabs.mySurveys[0]?.dueDate ?? ''));
  const [formTitle, setFormTitle] = useState(surveysMockData.surveyTemplate.title);
  const [sections, setSections] = useState<BuilderSection[]>(cloneSections());
  const [pendingDeleteSurvey, setPendingDeleteSurvey] = useState<ManagedSurvey | null>(null);

  const activeSurveys = surveysMockData.tabs.activeSurveys as ActiveSurvey[];

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

  function handleViewResponses(survey: ManagedSurvey) {
    console.log('survey_responses_requested', {
      surveyId: survey.id,
      status: survey.status,
      responseCount: survey.responseCount,
    });
  }

  function handleTemplateSelection(nextTemplateId: string) {
    setSelectedTemplateId(nextTemplateId);

    if (!nextTemplateId) {
      setFormTitle(surveysMockData.surveyTemplate.title);
      setSections(cloneSections());
      return;
    }

    const selectedTemplate = templates.find((template) => template.id === nextTemplateId);
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

  function openCreateSurveyModal() {
    setEditingSurveyId(null);
    setTemplateId(`survey-template-${Date.now()}`);
    setScope(surveysMockData.surveyTemplate.scope as SurveyScope);
    setDueDate(toIsoDate(surveysMockData.tabs.mySurveys[0]?.dueDate ?? ''));

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
      setFormTitle(surveysMockData.surveyTemplate.title);
      setSections(cloneSections());
    }

    setShowBuilder(true);
  }

  function openEditSurveyModal(survey: ManagedSurvey) {
    const existingTemplate = surveyTemplatesById[survey.id];
    const nextTemplateId = existingTemplate?.templateId ?? '';
    const nextScope = existingTemplate?.scope ?? getScopeFromAudience(survey.audience);
    const nextDueDate = existingTemplate?.dueDate ?? toIsoDate(survey.dueDate);
    const nextTitle = existingTemplate?.title ?? survey.title;
    const matchedTemplate = nextTemplateId
      ? templates.find((template) => template.id === nextTemplateId)
      : null;
    const nextSections = matchedTemplate
      ? cloneTemplateSectionsAsLocked(
        matchedTemplate.sections,
        matchedTemplate.title,
        matchedTemplate.description,
      )
      : (existingTemplate ? buildSectionsFromTemplate(existingTemplate) : cloneSections());

    setEditingSurveyId(survey.id);
    setTemplateId(existingTemplate?.templateId ?? `survey-template-${survey.id}`);
    setSelectedTemplateId(nextTemplateId || '');
    setScope(nextScope);
    setDueDate(nextDueDate);
    setFormTitle(nextTitle);
    setSections(nextSections);
    setShowBuilder(true);
  }

  function handleDeleteSurvey(surveyId: string) {
    setManagedSurveys((previous) => previous.filter((survey) => survey.id !== surveyId));
    setSurveyTemplatesById((previous) => {
      const next = { ...previous };
      delete next[surveyId];
      return next;
    });
  }

  function buildSurveyTemplatePayload(): SurveyTemplatePayload {
    return {
      templateId: selectedTemplateId || null,
      scope,
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

  function handleSaveSurvey() {
    const payload = buildSurveyTemplatePayload();
    const audience = getAudienceFromScope(scope);

    if (editingSurveyId) {
      setSurveyTemplatesById((previous) => ({ ...previous, [editingSurveyId]: payload }));
      setManagedSurveys((previous) => previous.map((survey) => (
        survey.id === editingSurveyId
          ? { ...survey, title: formTitle, audience, dueDate: toUsDate(dueDate) }
          : survey
      )));
    } else {
      const surveyId = `my-${Date.now()}`;
      const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
      setSurveyTemplatesById((previous) => ({ ...previous, [surveyId]: payload }));
      setManagedSurveys((previous) => [
        {
          id: surveyId,
          title: formTitle,
          audience,
          department: scope === 'All Employees' ? 'All Departments' : 'My Department',
          createdDate: formatDateForDisplay(new Date()),
          dueDate: toUsDate(dueDate),
          status: 'Draft',
          responseCount: 0,
          questionCount: totalQuestions,
        },
        ...previous,
      ]);
    }

    console.log('survey_template_payload', payload);
    setShowBuilder(false);
  }

  return (
    <section className="surveys-page">
      <header className="surveys-header-row">
        <div>
          <h1>{surveysMockData.pageTitle}</h1>
          <p>{surveysMockData.subtitle}</p>
        </div>
      </header>

      <div className="surveys-tabs">
        <button
          className={`surveys-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Surveys
        </button>
        <button
          className={`surveys-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Survey Dashboard
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="surveys-list">
          {activeSurveys.map((survey) => (
            <article className="survey-card" key={survey.id}>
              <div className="survey-card-header">
                <div className="survey-title-row">
                  <BarChart3 size={18} />
                  <h3>{survey.title}</h3>
                </div>
                <span className={statusClassMap[survey.status]}>{survey.status}</span>
              </div>

              <p>Audience: <strong>{survey.audience}</strong></p>
              <p>Due Date: <strong>{survey.dueDate}</strong></p>
              <p>Estimated Time: <strong>{survey.estimatedTime}</strong></p>
              <p>Questions: <strong>{survey.questionCount}</strong></p>

              <button className="survey-action-btn">
                <CircleDot size={15} />
                Answer Survey
              </button>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'my' && (
        <section className="my-surveys-section">
          <div className="my-surveys-header">
            <button className="create-survey-btn" onClick={openCreateSurveyModal}>
              <Plus size={16} />
              Create Survey
            </button>
          </div>
          <div className="my-surveys-table-wrap">
            <table className="my-surveys-table">
              <thead>
                <tr>
                  <th>Survey</th>
                  <th>Department</th>
                  <th>Created On</th>
                  <th>Due Date</th>
                  <th>No. of Questions</th>
                </tr>
              </thead>
              <tbody>
                {managedSurveys.map((survey) => (
                  <tr key={survey.id}>
                    <td>{survey.title}</td>
                    <td>{survey.department}</td>
                    <td>
                      <span className="table-icon-text">
                        <CalendarDays size={14} />
                        {survey.createdDate}
                      </span>
                    </td>
                    <td>{survey.dueDate}</td>
                    <td>{survey.questionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <TemplateBuilderModal
        isOpen={showBuilder}
        templateId={templateId}
        templateEntity="survey-template"
        modalTitle={editingSurveyId ? 'Edit Survey' : 'Create Survey'}
        modalDescription="Define sections, question types, and prompts for this survey."
        metaFields={[
          {
            id: 'survey-template-select',
            label: 'Survey Template',
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
          id: 'survey-scope',
          label: 'Scope',
          name: 'scope',
          dataField: 'scope',
          value: scope,
          onChange: (value) => setScope(value as SurveyScope),
          type: 'select',
          options: [
            { label: 'All Employees', value: 'All Employees' },
            { label: 'My Department', value: 'My Department' },
          ],
        }}
        afterSubjectFields={[
          {
            id: 'survey-due-date',
            label: 'Due Date',
            name: 'dueDate',
            dataField: 'dueDate',
            value: dueDate,
            onChange: setDueDate,
            type: 'date',
          },
        ]}
        titleField={{
          id: 'survey-title',
          label: 'Survey Title',
          name: 'title',
          dataField: 'title',
          value: formTitle,
          onChange: setFormTitle,
          disabled: Boolean(selectedTemplateId),
          disabledTooltip: selectedTemplateId
            ? 'Title is locked because this survey is using a saved template.'
            : undefined,
          helperText: selectedTemplateId
            ? 'Using a saved template. To edit title/questions, choose "None (Start from scratch)".'
            : undefined,
        }}
        sections={sections}
        setSections={setSections}
        existingSectionOptions={existingSectionOptions}
        saveButtonLabel={editingSurveyId ? 'Save Survey Changes' : 'Save Survey Template'}
        onSave={handleSaveSurvey}
        onClose={() => setShowBuilder(false)}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteSurvey)}
        title="Delete Survey"
        message={`Are you sure you want to delete "${pendingDeleteSurvey?.title ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteSurvey(null)}
        onConfirm={() => {
          if (pendingDeleteSurvey) {
            handleDeleteSurvey(pendingDeleteSurvey.id);
          }
          setPendingDeleteSurvey(null);
        }}
      />
    </section>
  );
}

export default SurveysPage;
