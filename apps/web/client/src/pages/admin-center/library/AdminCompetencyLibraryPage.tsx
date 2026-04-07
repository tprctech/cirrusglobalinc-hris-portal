import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import { useAuth } from '../../../app/AuthContext';
import { searchEmployees } from '../../../api/employees';
import type { AdminLearningMaterial, CompetencyLevel } from '../../../data/mock/adminMockData';
import '../AdminCenterPage.css';

const COMPETENCIES_API = '/api/v1/hr/competencies';

type AdminCompetencyLibraryPageProps = {
  onNavigate?: (path: string) => void;
};

const PAGE_SIZE = 8;

interface ApiCompetency {
  id: number;
  competency_code: string;
  competency_name: string;
  competency_description: string;
  expectations: string;
  competency_level: string;
  competency_experts: string;
  created_by: string;
  status: string;
  learning_materials: ApiLearningMaterial[];
}

interface ApiLearningMaterial {
  id: number;
  material_type: string;
  url: string;
  name: string;
  description: string;
  category: string;
  duration: string;
}

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
  status: string;
  learningMaterials: AdminLearningMaterial[];
};

type EditCompetency = {
  id: number;
  competencyCode: string;
  competencyName: string;
  competencyDescription: string;
  expectations: string;
  competencyLevel: string;
  competencyExperts: string;
  createdBy: string;
  status: string;
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

function apiToLocal(c: ApiCompetency): EditCompetency {
  return {
    id: c.id,
    competencyCode: c.competency_code,
    competencyName: c.competency_name,
    competencyDescription: c.competency_description,
    expectations: c.expectations,
    competencyLevel: c.competency_level,
    competencyExperts: c.competency_experts,
    createdBy: c.created_by,
    status: c.status || 'Active',
    learningMaterials: (c.learning_materials || []).map((m) => ({
      id: String(m.id),
      type: m.material_type || 'Link',
      url: m.url,
      name: m.name,
      description: m.description,
      category: m.category,
      duration: m.duration,
    })),
  };
}

function emptyDraft(): CompetencyDraft {
  return {
    competencyName: '',
    competencyDescription: '',
    expectations: '',
    competencyLevel: 'Entry Level',
    competencyExperts: '',
    status: 'Active',
    learningMaterials: [],
  };
}

function materialsToApi(mats: AdminLearningMaterial[]) {
  return mats.map((m) => ({
    material_type: m.type || 'Link',
    url: m.url,
    name: m.name,
    description: m.description || '',
    category: m.category || '',
    duration: m.duration || '',
  }));
}

type ExpertsPickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

function ExpertsPicker({ value, onChange, id }: ExpertsPickerProps) {
  const selected = useMemo(() => value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [], [value]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: number; first_name: string; middle_name: string; last_name: string; display_name?: string; email: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const data = await searchEmployees(q.trim());
      setResults(data);
      setShowDropdown(true);
    }, 300);
  }

  function displayName(emp: { first_name: string; middle_name: string; last_name: string; display_name?: string }) {
    if (emp.display_name) return emp.display_name;
    return [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ');
  }

  function addExpert(emp: { first_name: string; middle_name: string; last_name: string; display_name?: string }) {
    const name = displayName(emp);
    if (selected.includes(name)) return;
    const updated = [...selected, name].join(', ');
    onChange(updated);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  function removeExpert(name: string) {
    const updated = selected.filter((s) => s !== name).join(', ');
    onChange(updated);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="experts-picker-tags">
        {selected.map((name) => (
          <span key={name} className="experts-picker-tag">
            {name}
            <button type="button" onClick={() => removeExpert(name)} className="experts-picker-tag-remove">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        placeholder={selected.length > 0 ? 'Search more users...' : 'Search users...'}
        autoComplete="off"
      />
      {showDropdown && results.length > 0 && (
        <div className="experts-picker-dropdown">
          {results.filter((emp) => !selected.includes(displayName(emp))).map((emp) => (
            <div
              key={emp.id}
              className="experts-picker-option"
              onClick={() => addExpert(emp)}
            >
              <span className="experts-picker-option-name">{displayName(emp)}</span>
              <span className="experts-picker-option-email">{emp.email}</span>
            </div>
          ))}
          {results.filter((emp) => !selected.includes(displayName(emp))).length === 0 && (
            <div className="experts-picker-option" style={{ color: 'var(--gray-400)', cursor: 'default' }}>All results already selected</div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminCompetencyLibraryPage({ onNavigate }: AdminCompetencyLibraryPageProps) {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<ApiCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompetency, setEditingCompetency] = useState<EditCompetency | null>(null);
  const [showAddCompetencyModal, setShowAddCompetencyModal] = useState(false);
  const [newCompetency, setNewCompetency] = useState<CompetencyDraft>(emptyDraft());
  const [currentPage, setCurrentPage] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [nameError, setNameError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
  const [pendingDeleteCompetency, setPendingDeleteCompetency] = useState<ApiCompetency | null>(null);
  const [pendingDeleteLearningMaterial, setPendingDeleteLearningMaterial] = useState<PendingDeleteLearningMaterial | null>(null);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const loadCompetencies = useCallback(async () => {
    try {
      const res = await fetch(COMPETENCIES_API + '/');
      if (res.ok) {
        setCompetencies(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetencies();
  }, [loadCompetencies]);

  const filteredCompetencies = useMemo(() => {
    let list = competencies;
    if (filterStatus !== 'all') {
      list = list.filter((c) => c.status === filterStatus);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((c) =>
        c.competency_name.toLowerCase().includes(q) ||
        c.competency_code.toLowerCase().includes(q) ||
        c.competency_description.toLowerCase().includes(q) ||
        (c.created_by || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [competencies, filterStatus, searchTerm]);

  const filteredLibraryMaterials = useMemo(() => {
    const query = materialSearchTerm.trim().toLowerCase();
    if (!query) return materialLibrary;
    return materialLibrary.filter((material) =>
      [material.name, material.url, material.description ?? '', material.category ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [materialLibrary, materialSearchTerm]);

  function attachMaterialsToTarget(materials: AdminLearningMaterial[]) {
    if (materialTarget === 'new') {
      setNewCompetency((prev) => {
        const existingIds = new Set(prev.learningMaterials.map((item) => item.id));
        const toAdd = materials.filter((item) => !existingIds.has(item.id));
        return { ...prev, learningMaterials: [...prev.learningMaterials, ...toAdd] };
      });
    }
    if (materialTarget === 'edit') {
      setEditingCompetency((prev) => {
        if (!prev) return prev;
        const existingIds = new Set(prev.learningMaterials.map((item) => item.id));
        const toAdd = materials.filter((item) => !existingIds.has(item.id));
        return { ...prev, learningMaterials: [...prev.learningMaterials, ...toAdd] };
      });
    }
  }

  function removeLearningMaterialFromTarget(target: Exclude<MaterialTarget, null>, materialId: string) {
    if (target === 'new') {
      setNewCompetency((prev) => ({
        ...prev,
        learningMaterials: prev.learningMaterials.filter((m) => m.id !== materialId),
      }));
      return;
    }
    setEditingCompetency((prev) => {
      if (!prev) return prev;
      return { ...prev, learningMaterials: prev.learningMaterials.filter((m) => m.id !== materialId) };
    });
  }

  function openNewMaterialModal(target: Exclude<MaterialTarget, null>) {
    setMaterialTarget(target);
    setMaterialUrlError('');
    setMaterialNameError('');
    setNewLearningMaterial({ id: '', type: 'Link', url: '', name: '', description: '', category: '', duration: '' });
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
      if (!trimmedUrl) setMaterialUrlError('URL is required.');
      if (!trimmedName) setMaterialNameError('Learning material name is required.');
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

    setMaterialLibrary((prev) => [material, ...prev]);
    attachMaterialsToTarget([material]);
    setShowNewMaterialModal(false);
    setMaterialTarget(null);
  }

  function handleAttachSelectedLibraryMaterials() {
    if (!selectedLibraryMaterialIds.length) return;
    const selectedMaterials = materialLibrary.filter((m) => selectedLibraryMaterialIds.includes(m.id));
    attachMaterialsToTarget(selectedMaterials);
    setShowLibraryMaterialsModal(false);
    setMaterialTarget(null);
  }

  function getNextCompetencyCode(): string {
    const maxSeq = competencies.reduce((max, c) => {
      const parsed = Number(c.competency_code.replace('CMP-', ''));
      if (Number.isNaN(parsed)) return max;
      return Math.max(max, parsed);
    }, 0);
    return `CMP-${String(maxSeq + 1).padStart(3, '0')}`;
  }

  async function handleAddCompetency() {
    setNameError('');
    setSubmitError('');
    if (!newCompetency.competencyName.trim()) {
      setNameError('Competency Name is required.');
      return;
    }
    try {
      const res = await fetch(COMPETENCIES_API + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competency_code: getNextCompetencyCode(),
          competency_name: newCompetency.competencyName.trim(),
          competency_description: newCompetency.competencyDescription.trim(),
          expectations: newCompetency.expectations.trim(),
          competency_level: newCompetency.competencyLevel,
          competency_experts: newCompetency.competencyExperts.trim(),
          created_by: user?.employee?.displayName || user?.email || 'Admin',
          status: newCompetency.status,
          learning_materials: materialsToApi(newCompetency.learningMaterials),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to create' }));
        setSubmitError(data.detail || 'Failed to create competency');
        return;
      }
      setShowAddCompetencyModal(false);
      setNewCompetency(emptyDraft());
      setCurrentPage(1);
      await loadCompetencies();
    } catch {
      setSubmitError('Network error');
    }
  }

  async function handleSaveEditedCompetency() {
    if (!editingCompetency) return;
    setSubmitError('');
    try {
      const res = await fetch(`${COMPETENCIES_API}/${editingCompetency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competency_code: editingCompetency.competencyCode,
          competency_name: editingCompetency.competencyName.trim(),
          competency_description: editingCompetency.competencyDescription.trim(),
          expectations: editingCompetency.expectations.trim(),
          competency_level: editingCompetency.competencyLevel,
          competency_experts: editingCompetency.competencyExperts.trim(),
          created_by: editingCompetency.createdBy,
          status: editingCompetency.status,
          learning_materials: materialsToApi(editingCompetency.learningMaterials),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to update' }));
        setSubmitError(data.detail || 'Failed to update competency');
        return;
      }
      setEditingCompetency(null);
      await loadCompetencies();
    } catch {
      setSubmitError('Network error');
    }
  }

  const [deleteError, setDeleteError] = useState('');

  async function handleDeleteCompetency(id: number) {
    setDeleteError('');
    try {
      const res = await fetch(`${COMPETENCIES_API}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to delete competency.' }));
        setDeleteError(data.detail || 'Failed to delete competency.');
        return;
      }
      await loadCompetencies();
    } catch {
      setDeleteError('Failed to delete competency.');
    }
  }

  function toggleLibraryMaterialSelection(materialId: string) {
    setSelectedLibraryMaterialIds((prev) =>
      prev.includes(materialId) ? prev.filter((id) => id !== materialId) : [...prev, materialId]
    );
  }

  const totalCompetencies = filteredCompetencies.length;
  const totalPages = Math.max(1, Math.ceil(totalCompetencies / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCompetencies = filteredCompetencies.slice(
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
              <button className="admin-invite-btn" onClick={() => { setNewCompetency(emptyDraft()); setNameError(''); setSubmitError(''); setShowAddCompetencyModal(true); }}>
                <Plus size={16} />
                Add Competency
              </button>
            </div>

            <div className="admin-filters-bar">
              <input
                className="admin-search-input"
                type="text"
                placeholder="Search competencies..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {loading ? (
              <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>Loading competencies...</div>
            ) : (
              <>
                {deleteError && (
                  <div className="admin-delete-error" style={{ background: '#fff1f2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
                    {deleteError}
                    <button onClick={() => setDeleteError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 600 }}>×</button>
                  </div>
                )}
                <div className="admin-users-table-wrap">
                  <table className="admin-users-table competency-table">
                    <thead>
                      <tr>
                        <th>Competency Code</th>
                        <th>Competency Name</th>
                        <th>Competency Description</th>
                        <th>Expectations</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalCompetencies === 0 && (
                        <tr>
                          <td colSpan={7} className="admin-empty-state">
                            No competencies available.
                          </td>
                        </tr>
                      )}
                      {pagedCompetencies.map((competency) => (
                        <tr key={competency.id}>
                          <td>{competency.competency_code}</td>
                          <td>{competency.competency_name}</td>
                          <td>{competency.competency_description}</td>
                          <td>{competency.expectations}</td>
                          <td>{competency.created_by}</td>
                          <td>
                            <span className={`admin-status-badge ${competency.status === 'Active' ? 'active' : 'inactive'}`}>
                              {competency.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions-cell">
                              <button
                                className="admin-edit-btn"
                                onClick={() => { setEditingCompetency(apiToLocal(competency)); setSubmitError(''); }}
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
              </>
            )}
          </section>
        </div>
      </div>

      {showAddCompetencyModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Add Competency</h3>
                <p>Create a new competency for the library.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setShowAddCompetencyModal(false)}>
                <X size={16} />
              </button>
            </div>

            {submitError && <div className="admin-form-error">{submitError}</div>}

            <div className="admin-edit-grid single-column">
              <div className="admin-form-field">
                <label htmlFor="add-competency-name">Competency Name <span className="required">*</span></label>
                <input
                  id="add-competency-name"
                  className={nameError ? 'admin-input-invalid' : ''}
                  value={newCompetency.competencyName}
                  onChange={(e) => { setNewCompetency((prev) => ({ ...prev, competencyName: e.target.value })); setNameError(''); }}
                />
                {nameError && <small className="admin-field-error">{nameError}</small>}
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-level">Competency Level</label>
                <select
                  id="add-competency-level"
                  value={newCompetency.competencyLevel}
                  onChange={(e) => setNewCompetency((prev) => ({ ...prev, competencyLevel: e.target.value as CompetencyLevel }))}
                >
                  {competencyLevelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-status">Status</label>
                <select
                  id="add-competency-status"
                  value={newCompetency.status}
                  onChange={(e) => setNewCompetency((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-experts">Competency Expert(s) (optional)</label>
                <ExpertsPicker
                  id="add-competency-experts"
                  value={newCompetency.competencyExperts}
                  onChange={(val) => setNewCompetency((prev) => ({ ...prev, competencyExperts: val }))}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-description">Competency Description</label>
                <textarea
                  id="add-competency-description"
                  rows={4}
                  value={newCompetency.competencyDescription}
                  onChange={(e) => setNewCompetency((prev) => ({ ...prev, competencyDescription: e.target.value }))}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="add-competency-expectations">Expectations</label>
                <textarea
                  id="add-competency-expectations"
                  rows={4}
                  value={newCompetency.expectations}
                  onChange={(e) => setNewCompetency((prev) => ({ ...prev, expectations: e.target.value }))}
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
                      <a href={material.url} target="_blank" rel="noreferrer">{material.name}</a>
                      <button
                        className="admin-learning-remove-btn"
                        onClick={() => setPendingDeleteLearningMaterial({ target: 'new', materialId: material.id, materialName: material.name })}
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
              <button className="admin-secondary-btn" onClick={() => setShowAddCompetencyModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleAddCompetency}>Add Competency</button>
            </div>
          </section>
        </div>
      )}

      {editingCompetency && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Edit Competency</h3>
                <p>Update competency information and save changes.</p>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setEditingCompetency(null)}>
                <X size={16} />
              </button>
            </div>

            {submitError && <div className="admin-form-error">{submitError}</div>}

            <div className="admin-edit-grid single-column">
              <div className="admin-form-field">
                <label htmlFor="edit-competency-name">Competency Name</label>
                <input
                  id="edit-competency-name"
                  value={editingCompetency.competencyName}
                  onChange={(e) => setEditingCompetency((prev) => prev ? { ...prev, competencyName: e.target.value } : prev)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-level">Competency Level</label>
                <select
                  id="edit-competency-level"
                  value={editingCompetency.competencyLevel}
                  onChange={(e) => setEditingCompetency((prev) => prev ? { ...prev, competencyLevel: e.target.value } : prev)}
                >
                  {competencyLevelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-status">Status</label>
                <select
                  id="edit-competency-status"
                  value={editingCompetency.status}
                  onChange={(e) => setEditingCompetency((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-experts">Competency Expert(s) (optional)</label>
                <ExpertsPicker
                  id="edit-competency-experts"
                  value={editingCompetency.competencyExperts}
                  onChange={(val) => setEditingCompetency((prev) => prev ? { ...prev, competencyExperts: val } : prev)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-description">Competency Description</label>
                <textarea
                  id="edit-competency-description"
                  rows={4}
                  value={editingCompetency.competencyDescription}
                  onChange={(e) => setEditingCompetency((prev) => prev ? { ...prev, competencyDescription: e.target.value } : prev)}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-competency-expectations">Expectations</label>
                <textarea
                  id="edit-competency-expectations"
                  rows={4}
                  value={editingCompetency.expectations}
                  onChange={(e) => setEditingCompetency((prev) => prev ? { ...prev, expectations: e.target.value } : prev)}
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
                      <a href={material.url} target="_blank" rel="noreferrer">{material.name}</a>
                      <button
                        className="admin-learning-remove-btn"
                        onClick={() => setPendingDeleteLearningMaterial({ target: 'edit', materialId: material.id, materialName: material.name })}
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
              <button className="admin-secondary-btn" onClick={() => setEditingCompetency(null)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveEditedCompetency}>Save Changes</button>
            </div>
          </section>
        </div>
      )}

      {showNewMaterialModal && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-learning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div><h3>New learning material</h3></div>
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
                onChange={(e) => { setNewLearningMaterial((prev) => ({ ...prev, url: e.target.value })); if (materialUrlError) setMaterialUrlError(''); }}
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
                onChange={(e) => { setNewLearningMaterial((prev) => ({ ...prev, name: e.target.value })); if (materialNameError) setMaterialNameError(''); }}
              />
              {materialNameError && <small className="admin-field-error">{materialNameError}</small>}
            </div>

            <div className="admin-form-field">
              <label htmlFor="learning-description">Description (optional)</label>
              <textarea
                id="learning-description"
                rows={5}
                value={newLearningMaterial.description}
                onChange={(e) => setNewLearningMaterial((prev) => ({ ...prev, description: e.target.value }))}
              />
              <small>Note: You can paste images.</small>
            </div>

            <div className="admin-learning-select-grid">
              <div className="admin-form-field">
                <label htmlFor="learning-category">Category (optional)</label>
                <select
                  id="learning-category"
                  value={newLearningMaterial.category}
                  onChange={(e) => setNewLearningMaterial((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select</option>
                  {categoryOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="learning-duration">Duration (optional)</label>
                <select
                  id="learning-duration"
                  value={newLearningMaterial.duration}
                  onChange={(e) => setNewLearningMaterial((prev) => ({ ...prev, duration: e.target.value }))}
                >
                  <option value="">Select</option>
                  {durationOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
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
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-library-list">
              {filteredLibraryMaterials.length === 0 && <p className="admin-library-empty">No materials found.</p>}
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
              <button className="admin-secondary-btn" onClick={() => setShowLibraryMaterialsModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleAttachSelectedLibraryMaterials}>Add Selected</button>
            </div>
          </section>
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteCompetency)}
        title="Delete Competency"
        message={`Are you sure you want to delete "${pendingDeleteCompetency?.competency_name ?? ''}"?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteCompetency(null)}
        onConfirm={() => {
          if (pendingDeleteCompetency) handleDeleteCompetency(pendingDeleteCompetency.id);
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
            removeLearningMaterialFromTarget(pendingDeleteLearningMaterial.target, pendingDeleteLearningMaterial.materialId);
          }
          setPendingDeleteLearningMaterial(null);
        }}
      />
    </section>
  );
}

export default AdminCompetencyLibraryPage;
