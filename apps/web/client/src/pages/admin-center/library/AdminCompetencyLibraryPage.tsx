import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import {
  adminMockData,
  type AdminCompetency,
  type AdminLearningMaterial,
  type CompetencyLevel,
} from '../../../data/mock/adminMockData';
import '../AdminCenterPage.css';

type AdminCompetencyLibraryPageProps = {
  onNavigate?: (path: string) => void;
};

const PAGE_SIZE = 8;

type MaterialTarget = 'new' | 'edit' | null;
type PendingDeleteLearningMaterial = {
  target: Exclude<MaterialTarget, null>;
  materialId: string;
  materialName: string;
};

type CompetencyDraft = {
  competencyName: string;
  competencyDescription: string;
  expectations: string;
  competencyLevel: CompetencyLevel;
  competencyExperts: string;
  learningMaterials: AdminLearningMaterial[];
};

const competencyLevelOptions: CompetencyLevel[] = [
  'C-Level',
  'Entry Level',
  'Experienced/Professional Level',
  'Intermediate Level',
  'Leadership/Management Level',
];

const categoryOptions = ['Leadership', 'Communication', 'Technical', 'Compliance'];
const durationOptions = ['15 mins', '30 mins', '45 mins', '60 mins'];

function getInitialCompetencyDraft(): CompetencyDraft {
  return {
    competencyName: '',
    competencyDescription: '',
    expectations: '',
    competencyLevel: 'Entry Level',
    competencyExperts: '',
    learningMaterials: [],
  };
}

function AdminCompetencyLibraryPage({ onNavigate }: AdminCompetencyLibraryPageProps) {
  const [competencies, setCompetencies] = useState<AdminCompetency[]>(
    adminMockData.competencies as AdminCompetency[],
  );
  const [editingCompetency, setEditingCompetency] = useState<AdminCompetency | null>(null);
  const [showAddCompetencyModal, setShowAddCompetencyModal] = useState(false);
  const [newCompetency, setNewCompetency] = useState<CompetencyDraft>(getInitialCompetencyDraft());
  const [currentPage, setCurrentPage] = useState(1);

  const [materialTarget, setMaterialTarget] = useState<MaterialTarget>(null);
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
  const [showLibraryMaterialsModal, setShowLibraryMaterialsModal] = useState(false);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [selectedLibraryMaterialIds, setSelectedLibraryMaterialIds] = useState<string[]>([]);
  const [materialLibrary, setMaterialLibrary] = useState<AdminLearningMaterial[]>([
    {
      id: 'material-1',
      type: 'Link',
      url: 'https://example.com/communication-basics',
      name: 'Communication Basics',
      description: 'Foundational communication best practices for teams.',
      category: 'Communication',
      duration: '30 mins',
    },
    {
      id: 'material-2',
      type: 'Link',
      url: 'https://example.com/leadership-playbook',
      name: 'Leadership Playbook',
      description: 'Guide for coaching and decision-making frameworks.',
      category: 'Leadership',
      duration: '45 mins',
    },
  ]);
  const [newLearningMaterial, setNewLearningMaterial] = useState<AdminLearningMaterial>({
    id: '',
    type: 'Link',
    url: '',
    name: '',
    description: '',
    category: '',
    duration: '',
  });
  const [materialUrlError, setMaterialUrlError] = useState('');
  const [materialNameError, setMaterialNameError] = useState('');
  const [pendingDeleteCompetency, setPendingDeleteCompetency] = useState<AdminCompetency | null>(null);
  const [pendingDeleteLearningMaterial, setPendingDeleteLearningMaterial] = useState<PendingDeleteLearningMaterial | null>(null);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const filteredLibraryMaterials = useMemo(() => {
    const query = materialSearchTerm.trim().toLowerCase();
    if (!query) {
      return materialLibrary;
    }

    return materialLibrary.filter((material) => [material.name, material.url, material.description ?? '', material.category ?? '']
      .join(' ')
      .toLowerCase()
      .includes(query));
  }, [materialLibrary, materialSearchTerm]);

  function updateEditingCompetencyField(field: keyof AdminCompetency, value: string) {
    setEditingCompetency((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, [field]: value };
    });
  }

  function updateNewCompetencyField(field: keyof CompetencyDraft, value: string) {
    setNewCompetency((previous) => ({ ...previous, [field]: value }));
  }

  function getNextCompetencyCode(): string {
    const maxSequence = competencies.reduce((max, competency) => {
      const parsed = Number(competency.competencyCode.replace('CMP-', ''));
      if (Number.isNaN(parsed)) {
        return max;
      }
      return Math.max(max, parsed);
    }, 0);
    return `CMP-${String(maxSequence + 1).padStart(3, '0')}`;
  }

  function attachMaterialsToTarget(materials: AdminLearningMaterial[]) {
    if (materialTarget === 'new') {
      setNewCompetency((previous) => {
        const existingIds = new Set(previous.learningMaterials.map((item) => item.id));
        const toAdd = materials.filter((item) => !existingIds.has(item.id));
        return { ...previous, learningMaterials: [...previous.learningMaterials, ...toAdd] };
      });
    }

    if (materialTarget === 'edit') {
      setEditingCompetency((previous) => {
        if (!previous) {
          return previous;
        }
        const existingIds = new Set(previous.learningMaterials.map((item) => item.id));
        const toAdd = materials.filter((item) => !existingIds.has(item.id));
        return { ...previous, learningMaterials: [...previous.learningMaterials, ...toAdd] };
      });
    }
  }

  function removeLearningMaterialFromTarget(target: Exclude<MaterialTarget, null>, materialId: string) {
    if (target === 'new') {
      setNewCompetency((previous) => ({
        ...previous,
        learningMaterials: previous.learningMaterials.filter((material) => material.id !== materialId),
      }));
      return;
    }

    setEditingCompetency((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        learningMaterials: previous.learningMaterials.filter((material) => material.id !== materialId),
      };
    });
  }

  function openNewMaterialModal(target: Exclude<MaterialTarget, null>) {
    setMaterialTarget(target);
    setMaterialUrlError('');
    setMaterialNameError('');
    setNewLearningMaterial({
      id: '',
      type: 'Link',
      url: '',
      name: '',
      description: '',
      category: '',
      duration: '',
    });
    setShowNewMaterialModal(true);
  }

  function openLibraryMaterialsModal(target: Exclude<MaterialTarget, null>) {
    setMaterialTarget(target);
    setMaterialSearchTerm('');
    setSelectedLibraryMaterialIds([]);
    setShowLibraryMaterialsModal(true);
  }

  function handleSaveNewMaterial() {
    const trimmedUrl = newLearningMaterial.url.trim();
    const trimmedName = newLearningMaterial.name.trim();
    if (!trimmedUrl || !trimmedName) {
      if (!trimmedUrl) {
        setMaterialUrlError('URL is required.');
      }
      if (!trimmedName) {
        setMaterialNameError('Learning material name is required.');
      }
      return;
    }
    if (!trimmedUrl.startsWith('https://')) {
      setMaterialUrlError('Invalid URL. Please enter a URL starting with https://');
      return;
    }
    setMaterialUrlError('');
    setMaterialNameError('');

    const material: AdminLearningMaterial = {
      ...newLearningMaterial,
      id: `material-${Date.now()}`,
      url: trimmedUrl,
      name: trimmedName,
      description: newLearningMaterial.description?.trim(),
      category: newLearningMaterial.category?.trim(),
      duration: newLearningMaterial.duration?.trim(),
    };

    setMaterialLibrary((previous) => [material, ...previous]);
    attachMaterialsToTarget([material]);
    setShowNewMaterialModal(false);
    setMaterialTarget(null);
  }

  function handleAttachSelectedLibraryMaterials() {
    if (!selectedLibraryMaterialIds.length) {
      return;
    }

    const selectedMaterials = materialLibrary.filter((material) => selectedLibraryMaterialIds.includes(material.id));
    attachMaterialsToTarget(selectedMaterials);
    setShowLibraryMaterialsModal(false);
    setMaterialTarget(null);
  }

  function handleAddCompetency() {
    if (!newCompetency.competencyName.trim()) {
      return;
    }

    const competency: AdminCompetency = {
      id: `competency-${Date.now()}`,
      competencyCode: getNextCompetencyCode(),
      competencyName: newCompetency.competencyName.trim(),
      competencyDescription: newCompetency.competencyDescription.trim(),
      expectations: newCompetency.expectations.trim(),
      competencyLevel: newCompetency.competencyLevel,
      competencyExperts: newCompetency.competencyExperts.trim(),
      learningMaterials: newCompetency.learningMaterials,
    };

    console.log('add_competency_payload', competency);
    setCompetencies((previous) => [competency, ...previous]);
    setNewCompetency(getInitialCompetencyDraft());
    setShowAddCompetencyModal(false);
  }

  function handleSaveEditedCompetency() {
    if (!editingCompetency) {
      return;
    }

    console.log('edit_competency_payload', {
      competencyId: editingCompetency.id,
      competency: editingCompetency,
    });
    setCompetencies((previous) => previous.map((competency) => (
      competency.id === editingCompetency.id ? editingCompetency : competency
    )));
    setEditingCompetency(null);
  }

  function handleDeleteCompetency(competencyId: string) {
    console.log('delete_competency_payload', { competencyId });
    setCompetencies((previous) => previous.filter((competency) => competency.id !== competencyId));
  }

  function toggleLibraryMaterialSelection(materialId: string) {
    setSelectedLibraryMaterialIds((previous) => {
      if (previous.includes(materialId)) {
        return previous.filter((id) => id !== materialId);
      }
      return [...previous, materialId];
    });
  }

  const totalCompetencies = competencies.length;
  const totalPages = Math.max(1, Math.ceil(totalCompetencies / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCompetencies = competencies.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="libraryCompetency" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1>Competency Library</h1>
                <p>Manage available competencies and expectations.</p>
              </div>
              <button className="admin-invite-btn" onClick={() => setShowAddCompetencyModal(true)}>
                <Plus size={16} />
                Add Competency
              </button>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table competency-table">
                <thead>
                  <tr>
                    <th>Competency Code</th>
                    <th>Competency Name</th>
                    <th>Competency Description</th>
                    <th>Expectations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {totalCompetencies === 0 && (
                    <tr>
                      <td colSpan={5} className="admin-empty-state">
                        No competencies available.
                      </td>
                    </tr>
                  )}
                  {pagedCompetencies.map((competency) => (
                    <tr key={competency.id}>
                      <td>{competency.competencyCode}</td>
                      <td>{competency.competencyName}</td>
                      <td>{competency.competencyDescription}</td>
                      <td>{competency.expectations}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-edit-btn"
                            onClick={() => setEditingCompetency({ ...competency })}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-delete-btn"
                            onClick={() => setPendingDeleteCompetency(competency)}
                          >
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
              totalItems={totalCompetencies}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
      </div>

      {showAddCompetencyModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add Competency</h3>
                <p>Create a new competency for the library.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowAddCompetencyModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-edit-grid single-column">
              <div className="admin-form-field">
                <label htmlFor="add-competency-name">Competency Name</label>
                <input
                  id="add-competency-name"
                  value={newCompetency.competencyName}
                  onChange={(event) => updateNewCompetencyField('competencyName', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-level">Competency Level</label>
                <select
                  id="add-competency-level"
                  value={newCompetency.competencyLevel}
                  onChange={(event) => updateNewCompetencyField('competencyLevel', event.target.value)}
                >
                  {competencyLevelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-experts">Competency Expert(s) (optional)</label>
                <input
                  id="add-competency-experts"
                  value={newCompetency.competencyExperts}
                  onChange={(event) => updateNewCompetencyField('competencyExperts', event.target.value)}
                  placeholder="Enter expert names"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-description">Competency Description</label>
                <textarea
                  id="add-competency-description"
                  rows={4}
                  value={newCompetency.competencyDescription}
                  onChange={(event) => updateNewCompetencyField('competencyDescription', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-expectations">Expectations</label>
                <textarea
                  id="add-competency-expectations"
                  rows={4}
                  value={newCompetency.expectations}
                  onChange={(event) => updateNewCompetencyField('expectations', event.target.value)}
                />
              </div>

              <div className="admin-learning-materials-block">
                <label>Learning Materials (optional)</label>
                <div className="admin-learning-materials-actions">
                  <button className="admin-secondary-btn" onClick={() => openNewMaterialModal('new')}>
                    Add new material
                  </button>
                  <button className="admin-secondary-btn" onClick={() => openLibraryMaterialsModal('new')}>
                    Add materials from Library
                  </button>
                </div>
                <div className="admin-learning-material-list">
                  {newCompetency.learningMaterials.length === 0 && <p>No materials added yet.</p>}
                  {newCompetency.learningMaterials.map((material) => (
                    <div key={material.id} className="admin-learning-material-item">
                      <a href={material.url} target="_blank" rel="noreferrer">
                        {material.name}
                      </a>
                      <button
                        className="admin-learning-remove-btn"
                        onClick={() => setPendingDeleteLearningMaterial({
                          target: 'new',
                          materialId: material.id,
                          materialName: material.name,
                        })}
                        title={`Remove ${material.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowAddCompetencyModal(false)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleAddCompetency}>
                Add Competency
              </button>
            </div>
          </section>
        </div>
      )}

      {editingCompetency && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Edit Competency</h3>
                <p>Update competency information and save changes.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setEditingCompetency(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-edit-grid single-column">
              <div className="admin-form-field">
                <label htmlFor="edit-competency-name">Competency Name</label>
                <input
                  id="edit-competency-name"
                  value={editingCompetency.competencyName}
                  onChange={(event) => updateEditingCompetencyField('competencyName', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-level">Competency Level</label>
                <select
                  id="edit-competency-level"
                  value={editingCompetency.competencyLevel}
                  onChange={(event) => updateEditingCompetencyField('competencyLevel', event.target.value)}
                >
                  {competencyLevelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-experts">Competency Expert(s) (optional)</label>
                <input
                  id="edit-competency-experts"
                  value={editingCompetency.competencyExperts ?? ''}
                  onChange={(event) => updateEditingCompetencyField('competencyExperts', event.target.value)}
                  placeholder="Enter expert names"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-description">Competency Description</label>
                <textarea
                  id="edit-competency-description"
                  rows={4}
                  value={editingCompetency.competencyDescription}
                  onChange={(event) => updateEditingCompetencyField('competencyDescription', event.target.value)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-expectations">Expectations</label>
                <textarea
                  id="edit-competency-expectations"
                  rows={4}
                  value={editingCompetency.expectations}
                  onChange={(event) => updateEditingCompetencyField('expectations', event.target.value)}
                />
              </div>

              <div className="admin-learning-materials-block">
                <label>Learning Materials (optional)</label>
                <div className="admin-learning-materials-actions">
                  <button className="admin-secondary-btn" onClick={() => openNewMaterialModal('edit')}>
                    Add new material
                  </button>
                  <button className="admin-secondary-btn" onClick={() => openLibraryMaterialsModal('edit')}>
                    Add materials from Library
                  </button>
                </div>
                <div className="admin-learning-material-list">
                  {editingCompetency.learningMaterials.length === 0 && <p>No materials added yet.</p>}
                  {editingCompetency.learningMaterials.map((material) => (
                    <div key={material.id} className="admin-learning-material-item">
                      <a href={material.url} target="_blank" rel="noreferrer">
                        {material.name}
                      </a>
                      <button
                        className="admin-learning-remove-btn"
                        onClick={() => setPendingDeleteLearningMaterial({
                          target: 'edit',
                          materialId: material.id,
                          materialName: material.name,
                        })}
                        title={`Remove ${material.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setEditingCompetency(null)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleSaveEditedCompetency}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {showNewMaterialModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-learning-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>New learning material</h3>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowNewMaterialModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-form-field">
              <label htmlFor="learning-url">URL</label>
              <input
                id="learning-url"
                placeholder="Paste URL here"
                className={materialUrlError ? 'admin-input-invalid' : ''}
                value={newLearningMaterial.url}
                onChange={(event) => {
                  setNewLearningMaterial((previous) => ({ ...previous, url: event.target.value }));
                  if (materialUrlError) {
                    setMaterialUrlError('');
                  }
                }}
              />
              <small className={materialUrlError ? 'admin-field-error' : ''}>
                {materialUrlError || 'Only URLs with https are allowed'}
              </small>
            </div>

            <div className="admin-form-field">
              <label htmlFor="learning-name">Learning material name</label>
              <input
                id="learning-name"
                placeholder="Example: Presentation tutorial"
                className={materialNameError ? 'admin-input-invalid' : ''}
                value={newLearningMaterial.name}
                onChange={(event) => {
                  setNewLearningMaterial((previous) => ({ ...previous, name: event.target.value }));
                  if (materialNameError) {
                    setMaterialNameError('');
                  }
                }}
              />
              {materialNameError && <small className="admin-field-error">{materialNameError}</small>}
            </div>

            <div className="admin-form-field">
              <label htmlFor="learning-description">Description (optional)</label>
              <textarea
                id="learning-description"
                rows={5}
                value={newLearningMaterial.description}
                onChange={(event) => setNewLearningMaterial((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))}
              />
              <small>Note: You can paste images.</small>
            </div>

            <div className="admin-learning-select-grid">
              <div className="admin-form-field">
                <label htmlFor="learning-category">Category (optional)</label>
                <select
                  id="learning-category"
                  value={newLearningMaterial.category}
                  onChange={(event) => setNewLearningMaterial((previous) => ({
                    ...previous,
                    category: event.target.value,
                  }))}
                >
                  <option value="">Select</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="learning-duration">Duration (optional)</label>
                <select
                  id="learning-duration"
                  value={newLearningMaterial.duration}
                  onChange={(event) => setNewLearningMaterial((previous) => ({
                    ...previous,
                    duration: event.target.value,
                  }))}
                >
                  <option value="">Select</option>
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-primary-btn" onClick={handleSaveNewMaterial}>Save</button>
            </div>
          </section>
        </div>
      )}

      {showLibraryMaterialsModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add materials from Library</h3>
                <p>Search and select already uploaded materials.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowLibraryMaterialsModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-form-field">
              <label htmlFor="library-material-search">Search materials</label>
              <input
                id="library-material-search"
                placeholder="Search by name, url, category"
                value={materialSearchTerm}
                onChange={(event) => setMaterialSearchTerm(event.target.value)}
              />
            </div>

            <div className="admin-library-list">
              {filteredLibraryMaterials.length === 0 && (
                <p className="admin-library-empty">No materials found.</p>
              )}
              {filteredLibraryMaterials.map((material) => (
                <label key={material.id} className="admin-library-item">
                  <input
                    type="checkbox"
                    checked={selectedLibraryMaterialIds.includes(material.id)}
                    onChange={() => toggleLibraryMaterialSelection(material.id)}
                  />
                  <div>
                    <strong>{material.name}</strong>
                    <p>{material.url}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowLibraryMaterialsModal(false)}>
                Cancel
              </button>
              <button className="admin-primary-btn" onClick={handleAttachSelectedLibraryMaterials}>
                Add Selected
              </button>
            </div>
          </section>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteCompetency)}
        title="Delete Competency"
        message={`Are you sure you want to delete "${pendingDeleteCompetency?.competencyName ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteCompetency(null)}
        onConfirm={() => {
          if (pendingDeleteCompetency) {
            handleDeleteCompetency(pendingDeleteCompetency.id);
          }
          setPendingDeleteCompetency(null);
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteLearningMaterial)}
        title="Remove Learning Material"
        message={`Are you sure you want to remove "${pendingDeleteLearningMaterial?.materialName ?? ''}"?`}
        confirmLabel="Remove"
        onCancel={() => setPendingDeleteLearningMaterial(null)}
        onConfirm={() => {
          if (pendingDeleteLearningMaterial) {
            removeLearningMaterialFromTarget(
              pendingDeleteLearningMaterial.target,
              pendingDeleteLearningMaterial.materialId,
            );
          }
          setPendingDeleteLearningMaterial(null);
        }}
      />
    </section>
  );
}

export default AdminCompetencyLibraryPage;





