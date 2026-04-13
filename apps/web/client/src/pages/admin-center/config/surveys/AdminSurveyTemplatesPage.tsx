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
import { ROUTES } from '../../../../app/routes';
import {
  addSurveyTemplate,
  deleteSurveyTemplate,
  updateSurveyTemplate,
  useSurveyCatalog,
} from '../../../../data/surveyCatalogStore';
import '../../AdminCenterPage.css';

type AdminSurveyTemplatesPageProps = {
  onNavigate?: (path: string) => void;
};

type TemplateFormState = {
  id: string;
  description: string;
  title: string;
  sections: BuilderSection[];
};

const PAGE_SIZE = 8;

let formCounter = 0;

function nextFormId() {
  formCounter += 1;
  return `survey-template-form-${formCounter}`;
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

function AdminSurveyTemplatesPage({ onNavigate }: AdminSurveyTemplatesPageProps) {
  const { templates, questionSets, reload } = useSurveyCatalog();
  const [currentPage, setCurrentPage] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<TemplateFormState>({
    id: nextFormId(),
    title: 'New Survey Template',
    description: 'Reusable survey template',
    sections: [createDefaultSection()],
  });

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const totalRows = templates.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = templates.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const existingSectionOptions = useMemo<BuilderExistingSectionOption[]>(
    () => questionSets.map((questionSet) => ({
      id: questionSet.id,
      label: questionSet.title,
      description: questionSet.description,
      section: cloneSections([questionSet.section])[0],
    })),
    [questionSets],
  );

  function openCreateModal() {
    setEditingTemplateId(null);
    setFormState({
      id: nextFormId(),
      title: 'New Survey Template',
      description: 'Reusable survey template',
      sections: [createDefaultSection()],
    });
    setShowBuilder(true);
  }

  function openEditModal(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setEditingTemplateId(template.id);
    setFormState({
      id: nextFormId(),
      title: template.title,
      description: template.description,
      sections: cloneSections(template.sections),
    });
    setShowBuilder(true);
  }

  async function handleSaveTemplate() {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        title: formState.title,
        description: formState.description,
        sections: cloneSections(formState.sections),
      };
      if (editingTemplateId) {
        await updateSurveyTemplate(editingTemplateId, payload);
      } else {
        await addSurveyTemplate(payload);
      }
      setShowBuilder(false);
      await reload();
    } catch (err) {
      console.error('Failed to save survey template', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configSurveys" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1 className="admin-breadcrumb-title">
                  <button className="admin-breadcrumb-link" onClick={() => navigate(ROUTES.adminConfigSurveys)}>
                    Surveys
                  </button>
                  <span>&gt;</span>
                  <span>Survey Templates</span>
                </h1>
              </div>
              <button className="admin-invite-btn" onClick={openCreateModal}>Create New Template</button>
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
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-icon-action-btn"
                            title="Edit template"
                            onClick={() => openEditModal(row.id)}
                          >
                            <PenSquare size={14} />
                          </button>
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete template"
                            onClick={() => setPendingDeleteTemplateId(row.id)}
                          >
                            <Trash2 size={14} />
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
              totalItems={totalRows}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
      </div>

      <TemplateBuilderModal
        isOpen={showBuilder}
        templateId={formState.id}
        templateEntity="admin-survey-template"
        modalTitle={editingTemplateId ? 'Edit Survey Template' : 'Create Survey Template'}
        modalDescription="Create reusable survey templates without selecting a recipient."
        subjectField={{
          id: 'survey-template-title',
          label: 'Template Title',
          name: 'title',
          dataField: 'title',
          value: formState.title,
          onChange: (value) => setFormState((previous) => ({ ...previous, title: value })),
          type: 'text',
        }}
        titleField={{
          id: 'survey-template-description',
          label: 'Template Description',
          name: 'description',
          dataField: 'description',
          value: formState.description,
          onChange: (value) => setFormState((previous) => ({ ...previous, description: value })),
        }}
        sections={formState.sections}
        setSections={(nextSections) => {
          if (typeof nextSections === 'function') {
            setFormState((previous) => ({ ...previous, sections: nextSections(previous.sections) }));
            return;
          }
          setFormState((previous) => ({ ...previous, sections: nextSections }));
        }}
        existingSectionOptions={existingSectionOptions}
        saveButtonLabel={editingTemplateId ? 'Save Template Changes' : 'Save Template'}
        onSave={handleSaveTemplate}
        onClose={() => setShowBuilder(false)}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteTemplateId)}
        title="Delete Template"
        message="Are you sure you want to delete this survey template?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteTemplateId(null)}
        onConfirm={async () => {
          if (pendingDeleteTemplateId) {
            await deleteSurveyTemplate(pendingDeleteTemplateId);
            await reload();
          }
          setPendingDeleteTemplateId(null);
        }}
      />
    </section>
  );
}

export default AdminSurveyTemplatesPage;
