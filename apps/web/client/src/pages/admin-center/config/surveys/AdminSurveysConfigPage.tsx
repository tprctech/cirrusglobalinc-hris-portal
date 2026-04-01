import { useMemo, useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import TemplateBuilderModal, {
  type BuilderExistingSectionOption,
  type BuilderQuestionType,
  type BuilderSection,
} from '../../../../components/TemplateBuilderModal';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import {
  addSurveyTemplate,
  deleteSurveyTemplate,
  updateSurveyTemplate,
  addSurveyQuestionSet,
  deleteSurveyQuestionSet,
  updateSurveyQuestionSet,
  useSurveyCatalog,
} from '../../../../data/surveyCatalogStore';
import '../../AdminCenterPage.css';

type AdminSurveysConfigPageProps = {
  onNavigate?: (path: string) => void;
};

type TemplateFormState = {
  id: string;
  description: string;
  title: string;
  sections: BuilderSection[];
};

type QuestionSetFormState = {
  id: string;
  title: string;
  description: string;
  sections: BuilderSection[];
};

const PAGE_SIZE = 8;

let templateFormCounter = 0;
let qsFormCounter = 0;

function nextTemplateFormId() {
  templateFormCounter += 1;
  return `survey-template-form-${templateFormCounter}`;
}

function nextQsFormId() {
  qsFormCounter += 1;
  return `survey-question-set-form-${qsFormCounter}`;
}

function createDefaultSection(): BuilderSection {
  return {
    id: 'section-1',
    label: 'New Section',
    questions: [
      {
        id: 'question-1',
        prompt: 'New question',
        type: 'Long Answer' as BuilderQuestionType,
        options: [],
        required: false,
      },
    ],
  };
}

function createDefaultQsSection(): BuilderSection {
  return {
    id: 'section-1',
    label: 'Reusable Section',
    questions: [
      {
        id: 'question-1',
        prompt: 'New question',
        type: 'Long Answer' as BuilderQuestionType,
        options: [],
        required: false,
      },
    ],
  };
}

function cloneSections(sections: BuilderSection[]): BuilderSection[] {
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

function cloneSection(section: BuilderSection): BuilderSection {
  return cloneSections([section])[0];
}

function AdminSurveysConfigPage({ onNavigate }: AdminSurveysConfigPageProps) {
  const { templates, questionSets } = useSurveyCatalog();

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const [tplPage, setTplPage] = useState(1);
  const [showTplBuilder, setShowTplBuilder] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<string | null>(null);
  const [tplFormState, setTplFormState] = useState<TemplateFormState>({
    id: nextTemplateFormId(),
    title: 'New Survey Template',
    description: 'Reusable survey template',
    sections: [createDefaultSection()],
  });

  const [qsPage, setQsPage] = useState(1);
  const [showQsBuilder, setShowQsBuilder] = useState(false);
  const [editingQsId, setEditingQsId] = useState<string | null>(null);
  const [pendingDeleteQsId, setPendingDeleteQsId] = useState<string | null>(null);
  const [qsFormState, setQsFormState] = useState<QuestionSetFormState>({
    id: nextQsFormId(),
    title: 'New Question Set',
    description: 'Reusable section for survey templates',
    sections: [createDefaultQsSection()],
  });

  const tplTotalRows = templates.length;
  const tplTotalPages = Math.max(1, Math.ceil(tplTotalRows / PAGE_SIZE));
  const tplSafePage = Math.min(tplPage, tplTotalPages);
  const tplPagedRows = templates.slice((tplSafePage - 1) * PAGE_SIZE, tplSafePage * PAGE_SIZE);

  const qsTotalRows = questionSets.length;
  const qsTotalPages = Math.max(1, Math.ceil(qsTotalRows / PAGE_SIZE));
  const qsSafePage = Math.min(qsPage, qsTotalPages);
  const qsPagedRows = questionSets.slice((qsSafePage - 1) * PAGE_SIZE, qsSafePage * PAGE_SIZE);

  const existingSectionOptions = useMemo<BuilderExistingSectionOption[]>(
    () => questionSets.map((questionSet) => ({
      id: questionSet.id,
      label: questionSet.title,
      description: questionSet.description,
      section: cloneSections([questionSet.section])[0],
    })),
    [questionSets],
  );

  function openCreateTemplate() {
    setEditingTemplateId(null);
    setTplFormState({
      id: nextTemplateFormId(),
      title: 'New Survey Template',
      description: 'Reusable survey template',
      sections: [createDefaultSection()],
    });
    setShowTplBuilder(true);
  }

  function openEditTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setEditingTemplateId(template.id);
    setTplFormState({
      id: nextTemplateFormId(),
      title: template.title,
      description: template.description,
      sections: cloneSections(template.sections),
    });
    setShowTplBuilder(true);
  }

  function handleSaveTemplate() {
    const payload = {
      title: tplFormState.title,
      description: tplFormState.description,
      sections: cloneSections(tplFormState.sections),
    };
    if (editingTemplateId) {
      updateSurveyTemplate(editingTemplateId, payload);
    } else {
      addSurveyTemplate(payload);
    }
    setShowTplBuilder(false);
  }

  function openCreateQs() {
    setEditingQsId(null);
    setQsFormState({
      id: nextQsFormId(),
      title: 'New Question Set',
      description: 'Reusable section for survey templates',
      sections: [createDefaultQsSection()],
    });
    setShowQsBuilder(true);
  }

  function openEditQs(questionSetId: string) {
    const selected = questionSets.find((item) => item.id === questionSetId);
    if (!selected) return;
    setEditingQsId(selected.id);
    setQsFormState({
      id: nextQsFormId(),
      title: selected.title,
      description: selected.description,
      sections: [cloneSection(selected.section)],
    });
    setShowQsBuilder(true);
  }

  function handleSaveQs() {
    const section = cloneSection(qsFormState.sections[0] ?? createDefaultQsSection());
    const payload = { title: qsFormState.title, description: qsFormState.description, section };
    if (editingQsId) {
      updateSurveyQuestionSet(editingQsId, payload);
    } else {
      addSurveyQuestionSet(payload);
    }
    setShowQsBuilder(false);
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configSurveys" onNavigate={navigate} />

        <div className="admin-center-content">
          <div className="admin-users-toolbar">
            <div>
              <h1>Configuration &gt; Surveys</h1>
              <p>Manage admin-side settings for the employee portal Surveys module.</p>
            </div>
          </div>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Survey Templates</h2></div>
              <button className="admin-invite-btn" onClick={openCreateTemplate}>Create New Template</button>
            </div>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tplPagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit template" onClick={() => openEditTemplate(row.id)}>
                            <PenSquare size={14} />
                          </button>
                          <button className="admin-icon-action-btn danger" title="Delete template" onClick={() => setPendingDeleteTemplateId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={tplSafePage} totalItems={tplTotalRows} pageSize={PAGE_SIZE} onPageChange={setTplPage} />
          </section>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Survey Question Sets</h2></div>
              <button className="admin-invite-btn" onClick={openCreateQs}>Add New Question Set</button>
            </div>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qsPagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit question set" onClick={() => openEditQs(row.id)}>
                            <PenSquare size={14} />
                          </button>
                          <button className="admin-icon-action-btn danger" title="Delete question set" onClick={() => setPendingDeleteQsId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={qsSafePage} totalItems={qsTotalRows} pageSize={PAGE_SIZE} onPageChange={setQsPage} />
          </section>
        </div>
      </div>

      <TemplateBuilderModal
        isOpen={showTplBuilder}
        templateId={tplFormState.id}
        templateEntity="admin-survey-template"
        modalTitle={editingTemplateId ? 'Edit Survey Template' : 'Create Survey Template'}
        modalDescription="Create reusable survey templates without selecting a recipient."
        subjectField={{
          id: 'survey-template-title',
          label: 'Template Title',
          name: 'title',
          dataField: 'title',
          value: tplFormState.title,
          onChange: (value) => setTplFormState((previous) => ({ ...previous, title: value })),
          type: 'text',
        }}
        titleField={{
          id: 'survey-template-description',
          label: 'Template Description',
          name: 'description',
          dataField: 'description',
          value: tplFormState.description,
          onChange: (value) => setTplFormState((previous) => ({ ...previous, description: value })),
        }}
        sections={tplFormState.sections}
        setSections={(nextSections) => {
          if (typeof nextSections === 'function') {
            setTplFormState((previous) => ({ ...previous, sections: nextSections(previous.sections) }));
            return;
          }
          setTplFormState((previous) => ({ ...previous, sections: nextSections }));
        }}
        existingSectionOptions={existingSectionOptions}
        saveButtonLabel={editingTemplateId ? 'Save Template Changes' : 'Save Template'}
        onSave={handleSaveTemplate}
        onClose={() => setShowTplBuilder(false)}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteTemplateId)}
        title="Delete Template"
        message="Are you sure you want to delete this survey template?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteTemplateId(null)}
        onConfirm={() => {
          if (pendingDeleteTemplateId) deleteSurveyTemplate(pendingDeleteTemplateId);
          setPendingDeleteTemplateId(null);
        }}
      />

      <TemplateBuilderModal
        isOpen={showQsBuilder}
        templateId={qsFormState.id}
        templateEntity="admin-survey-question-set"
        modalTitle={editingQsId ? 'Edit Survey Question Set' : 'Create Survey Question Set'}
        modalDescription="Create reusable sections that can be inserted into survey templates and campaigns."
        subjectField={{
          id: 'survey-question-set-title',
          label: 'Question Set Title',
          name: 'title',
          dataField: 'title',
          value: qsFormState.title,
          onChange: (value) => setQsFormState((previous) => ({ ...previous, title: value })),
          type: 'text',
        }}
        titleField={{
          id: 'survey-question-set-description',
          label: 'Question Set Description',
          name: 'description',
          dataField: 'description',
          value: qsFormState.description,
          onChange: (value) => setQsFormState((previous) => ({ ...previous, description: value })),
        }}
        sections={qsFormState.sections}
        setSections={(nextSections) => {
          if (typeof nextSections === 'function') {
            setQsFormState((previous) => ({
              ...previous,
              sections: [cloneSection((nextSections(previous.sections)[0] ?? previous.sections[0]))],
            }));
            return;
          }
          setQsFormState((previous) => ({
            ...previous,
            sections: [cloneSection((nextSections[0] ?? previous.sections[0]))],
          }));
        }}
        allowMultipleSections={false}
        saveButtonLabel={editingQsId ? 'Save Question Set Changes' : 'Save Question Set'}
        onSave={handleSaveQs}
        onClose={() => setShowQsBuilder(false)}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteQsId)}
        title="Delete Question Set"
        message="Are you sure you want to delete this survey question set?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteQsId(null)}
        onConfirm={() => {
          if (pendingDeleteQsId) deleteSurveyQuestionSet(pendingDeleteQsId);
          setPendingDeleteQsId(null);
        }}
      />
    </section>
  );
}

export default AdminSurveysConfigPage;
