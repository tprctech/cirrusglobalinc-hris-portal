import { useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import TemplateBuilderModal, {
  type BuilderQuestionType,
  type BuilderSection,
} from '../../../../components/TemplateBuilderModal';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import { ROUTES } from '../../../../app/routes';
import {
  addReviewQuestionSet,
  deleteReviewQuestionSet,
  updateReviewQuestionSet,
  useReviewCatalog,
} from '../../../../data/reviewCatalogStore';
import '../../AdminCenterPage.css';

type AdminReviewQuestionSetsPageProps = {
  onNavigate?: (path: string) => void;
};

type QuestionSetFormState = {
  id: string;
  title: string;
  description: string;
  sections: BuilderSection[];
};

const PAGE_SIZE = 8;

let formCounter = 0;

function nextFormId() {
  formCounter += 1;
  return `review-question-set-form-${formCounter}`;
}

function createDefaultSection(): BuilderSection {
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

function cloneSection(section: BuilderSection): BuilderSection {
  return {
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
  };
}

function AdminReviewQuestionSetsPage({ onNavigate }: AdminReviewQuestionSetsPageProps) {
  const { questionSets, loading, reload } = useReviewCatalog();
  const [currentPage, setCurrentPage] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuestionSetId, setEditingQuestionSetId] = useState<string | null>(null);
  const [pendingDeleteQuestionSetId, setPendingDeleteQuestionSetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<QuestionSetFormState>({
    id: nextFormId(),
    title: 'New Question Set',
    description: 'Reusable section for review templates',
    sections: [createDefaultSection()],
  });

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const totalRows = questionSets.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = questionSets.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  function openCreateModal() {
    setEditingQuestionSetId(null);
    setFormState({
      id: nextFormId(),
      title: 'New Question Set',
      description: 'Reusable section for review templates',
      sections: [createDefaultSection()],
    });
    setShowBuilder(true);
  }

  function openEditModal(questionSetId: string) {
    const selected = questionSets.find((item) => item.id === questionSetId);
    if (!selected) {
      return;
    }

    setEditingQuestionSetId(selected.id);
    setFormState({
      id: nextFormId(),
      title: selected.title,
      description: selected.description,
      sections: [cloneSection(selected.section)],
    });
    setShowBuilder(true);
  }

  async function handleSaveQuestionSet() {
    if (saving) return;
    setSaving(true);
    try {
      const section = cloneSection(formState.sections[0] ?? createDefaultSection());
      const payload = {
        title: formState.title,
        description: formState.description,
        section,
      };
      if (editingQuestionSetId) {
        await updateReviewQuestionSet(editingQuestionSetId, payload);
      } else {
        await addReviewQuestionSet(payload);
      }
      setShowBuilder(false);
      await reload();
    } catch (err) {
      console.error('Failed to save review question set', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configReviews" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1 className="admin-breadcrumb-title">
                  <button className="admin-breadcrumb-link" onClick={() => navigate(ROUTES.adminConfigReviews)}>
                    Review
                  </button>
                  <span>&gt;</span>
                  <span>Review Question Sets</span>
                </h1>
              </div>
              <button className="admin-invite-btn" onClick={openCreateModal}>Add New Question Set</button>
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
                  {loading && (
                    <tr><td colSpan={3} className="admin-empty-state">Loading...</td></tr>
                  )}
                  {!loading && totalRows === 0 && (
                    <tr><td colSpan={3} className="admin-empty-state">No review question sets found.</td></tr>
                  )}
                  {!loading && pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-icon-action-btn"
                            title="Edit question set"
                            onClick={() => openEditModal(row.id)}
                          >
                            <PenSquare size={14} />
                          </button>
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete question set"
                            onClick={() => setPendingDeleteQuestionSetId(row.id)}
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
        templateEntity="admin-review-question-set"
        modalTitle={editingQuestionSetId ? 'Edit Review Question Set' : 'Create Review Question Set'}
        modalDescription="Create reusable sections that can be inserted into review templates and evaluations."
        subjectField={{
          id: 'review-question-set-title',
          label: 'Question Set Title',
          name: 'title',
          dataField: 'title',
          value: formState.title,
          onChange: (value) => setFormState((previous) => ({ ...previous, title: value })),
          type: 'text',
        }}
        titleField={{
          id: 'review-question-set-description',
          label: 'Question Set Description',
          name: 'description',
          dataField: 'description',
          value: formState.description,
          onChange: (value) => setFormState((previous) => ({ ...previous, description: value })),
        }}
        sections={formState.sections}
        setSections={(nextSections) => {
          if (typeof nextSections === 'function') {
            setFormState((previous) => ({
              ...previous,
              sections: [cloneSection((nextSections(previous.sections)[0] ?? previous.sections[0]))],
            }));
            return;
          }

          setFormState((previous) => ({
            ...previous,
            sections: [cloneSection((nextSections[0] ?? previous.sections[0]))],
          }));
        }}
        allowMultipleSections={false}
        saveButtonLabel={editingQuestionSetId ? 'Save Question Set Changes' : 'Save Question Set'}
        onSave={handleSaveQuestionSet}
        onClose={() => setShowBuilder(false)}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteQuestionSetId)}
        title="Delete Question Set"
        message="Are you sure you want to delete this review question set?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteQuestionSetId(null)}
        onConfirm={async () => {
          if (pendingDeleteQuestionSetId) {
            await deleteReviewQuestionSet(pendingDeleteQuestionSetId);
            await reload();
          }
          setPendingDeleteQuestionSetId(null);
        }}
      />
    </section>
  );
}

export default AdminReviewQuestionSetsPage;
