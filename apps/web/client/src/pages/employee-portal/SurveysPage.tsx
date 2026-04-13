import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CircleDot, Plus } from 'lucide-react';
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
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { surveysMockData } from '../../data/mock/menuMockData';
import { useSurveyCatalog } from '../../data/surveyCatalogStore';
import { useAuth } from '../../app/AuthContext';
import './SurveysPage.css';

const API_BASE = '/api/v1';

type SurveyTab = 'active' | 'my';
type SurveyStatus = 'Draft' | 'Active' | 'Inactive' | 'Completed';
type SurveyScope = 'All Employees' | 'My Department';

type Campaign = {
  id: number;
  template_id: number | null;
  title: string;
  scope: string;
  due_date: string | null;
  status: string;
  created_by_email: string;
  created_at: string | null;
};

type CampaignDetail = {
  id: number;
  template_id: number | null;
  title: string;
  scope: string;
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

function formatDateForDisplay(d: Date): string {
  return d.toLocaleDateString('en-US');
}

function toIsoDate(value: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [month, day, year] = value.split('/');
  if (!month || !day || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function toUsDate(value: string | null): string {
  if (!value) return 'TBD';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${Number(month)}/${Number(day)}/${year}`;
}

function SurveysPage() {
  const { user } = useAuth();
  const { templates, questionSets } = useSurveyCatalog();
  const [activeTab, setActiveTab] = useState<SurveyTab>('active');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [scope, setScope] = useState<SurveyScope>(surveysMockData.surveyTemplate.scope as SurveyScope);
  const [dueDate, setDueDate] = useState(toIsoDate(surveysMockData.tabs.mySurveys[0]?.dueDate ?? ''));
  const [formTitle, setFormTitle] = useState(surveysMockData.surveyTemplate.title);
  const [sections, setSections] = useState<BuilderSection[]>(cloneSections());
  const [creatingSurvey, setCreatingSurvey] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [activeCampaignDetail, setActiveCampaignDetail] = useState<CampaignDetail | null>(null);
  const [existingAnswers, setExistingAnswers] = useState<AnswerValue[]>([]);
  const [responseSaving, setResponseSaving] = useState(false);
  const [pendingDeleteCampaign, setPendingDeleteCampaign] = useState<Campaign | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/survey-campaigns`);
      if (res.ok) setCampaigns(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

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

  const activeSurveys: ActiveSurvey[] = campaigns
    .filter((c) => c.status === 'Active')
    .map((c) => ({
      id: String(c.id),
      title: c.title,
      audience: c.scope,
      dueDate: toUsDate(c.due_date),
      estimatedTime: '~5 min',
      questionCount: 0,
      status: 'Active' as const,
    }));

  const managedSurveys: ManagedSurvey[] = campaigns.map((c) => ({
    id: String(c.id),
    title: c.title,
    audience: c.scope,
    department: c.scope === 'All Employees' ? 'All Departments' : 'My Department',
    createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US') : '',
    dueDate: toUsDate(c.due_date),
    status: c.status as SurveyStatus,
    responseCount: 0,
    questionCount: 0,
  }));

  function handleTemplateSelection(nextTemplateId: string) {
    setSelectedTemplateId(nextTemplateId);
    if (!nextTemplateId) {
      setFormTitle(surveysMockData.surveyTemplate.title);
      setSections(cloneSections());
      return;
    }
    const tmpl = templates.find((t) => t.id === nextTemplateId);
    if (!tmpl) return;
    setFormTitle(tmpl.title);
    setSections(cloneTemplateSectionsAsLocked(tmpl.sections, tmpl.title, tmpl.description));
  }

  function openCreateSurveyModal() {
    setScope(surveysMockData.surveyTemplate.scope as SurveyScope);
    setDueDate(toIsoDate(surveysMockData.tabs.mySurveys[0]?.dueDate ?? ''));
    if (templates.length) {
      const first = templates[0];
      setSelectedTemplateId(first.id);
      setFormTitle(first.title);
      setSections(cloneTemplateSectionsAsLocked(first.sections, first.title, first.description));
    } else {
      setSelectedTemplateId('');
      setFormTitle(surveysMockData.surveyTemplate.title);
      setSections(cloneSections());
    }
    setShowBuilder(true);
  }

  async function handleSaveSurvey() {
    if (creatingSurvey) return;
    setCreatingSurvey(true);
    try {
      const templateDbId = selectedTemplateId ? Number(selectedTemplateId) : null;
      const res = await fetch(`${API_BASE}/survey-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateDbId,
          title: formTitle,
          scope,
          due_date: dueDate || null,
          created_by_email: user?.email ?? '',
        }),
      });
      if (res.ok) {
        setShowBuilder(false);
        await loadCampaigns();
      }
    } catch (err) {
      console.error('Failed to create survey campaign', err);
    } finally {
      setCreatingSurvey(false);
    }
  }

  async function openResponseForm(surveyId: string) {
    const campaignId = Number(surveyId);
    if (Number.isNaN(campaignId)) return;
    try {
      const res = await fetch(`${API_BASE}/survey-campaigns/${campaignId}`);
      if (!res.ok) return;
      const detail: CampaignDetail = await res.json();
      setActiveCampaignDetail(detail);

      const respRes = await fetch(`${API_BASE}/survey-campaigns/${campaignId}/responses`);
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
      console.error('Failed to load survey campaign', err);
    }
  }

  function buildResponseSections(): ResponseSection[] {
    if (!activeCampaignDetail) return [];
    return activeCampaignDetail.sections.map((sec) => ({
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
    if (!activeCampaignDetail || responseSaving) return;
    setResponseSaving(true);
    try {
      const res = await fetch(`${API_BASE}/survey-campaigns/${activeCampaignDetail.id}/responses`, {
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
        await loadCampaigns();
      }
    } catch (err) {
      console.error('Failed to save survey response', err);
    } finally {
      setResponseSaving(false);
    }
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

              <button
                className="survey-action-btn"
                onClick={() => openResponseForm(survey.id)}
              >
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
                  <th>Actions</th>
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
                    <td>
                      <button className="survey-action-btn small" onClick={() => openResponseForm(survey.id)}>
                        View Responses
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <TemplateBuilderModal
        isOpen={showBuilder}
        templateId={`survey-template-${Date.now()}`}
        templateEntity="survey-template"
        modalTitle="Create Survey"
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
            helperText: templates.find((t) => t.id === selectedTemplateId)?.description,
            options: [
              { label: 'None (Start from scratch)', value: '' },
              ...templates.map((t) => ({ label: t.title, value: t.id, description: t.description })),
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
        saveButtonLabel={creatingSurvey ? 'Saving...' : 'Save Survey'}
        onSave={handleSaveSurvey}
        onClose={() => setShowBuilder(false)}
      />

      <FormResponseModal
        isOpen={showResponseForm}
        title={activeCampaignDetail?.title ?? 'Survey'}
        description="Please answer each question below."
        meta={[
          { label: 'Scope', value: activeCampaignDetail?.scope ?? '' },
          { label: 'Due Date', value: toUsDate(activeCampaignDetail?.due_date ?? null) },
          { label: 'Status', value: activeCampaignDetail?.status ?? '' },
        ]}
        sections={buildResponseSections()}
        existingAnswers={existingAnswers}
        saving={responseSaving}
        onSaveDraft={(data) => handleSaveResponse(data)}
        onSubmit={(data) => handleSaveResponse(data)}
        onClose={() => setShowResponseForm(false)}
      />

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteCampaign)}
        title="Delete Survey"
        message={`Are you sure you want to delete "${pendingDeleteCampaign?.title ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteCampaign(null)}
        onConfirm={() => setPendingDeleteCampaign(null)}
      />
    </section>
  );
}

export default SurveysPage;
