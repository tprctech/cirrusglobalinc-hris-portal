import { useCallback, useEffect, useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import { useAuth } from '../../../../app/AuthContext';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminRecognitionBadgesPageProps = {
  onNavigate?: (path: string) => void;
};

type Badge = {
  id: number;
  image: string;
  title: string;
  description: string;
  is_official: boolean;
  point: number;
  is_active: boolean;
  created_by: string;
  updated_by: string;
};

const API = '/api/v1/hr/recognitions/badges';
const PAGE_SIZE = 8;

function AdminRecognitionBadgesPage({ onNavigate }: AdminRecognitionBadgesPageProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formImage, setFormImage] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsOfficial, setFormIsOfficial] = useState(false);
  const [formPoint, setFormPoint] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const loadBadges = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (res.ok) setRows(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  function openAddModal() {
    setEditingBadge(null);
    setFormImage('');
    setFormTitle('');
    setFormDescription('');
    setFormIsOfficial(false);
    setFormPoint(0);
    setFormIsActive(true);
    setShowModal(true);
  }

  function openEditModal(badge: Badge) {
    setEditingBadge(badge);
    setFormImage(badge.image);
    setFormTitle(badge.title);
    setFormDescription(badge.description);
    setFormIsOfficial(badge.is_official);
    setFormPoint(badge.point);
    setFormIsActive(badge.is_active);
    setShowModal(true);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 24, 24);
          setFormImage(canvas.toDataURL('image/png'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (saving || !formTitle.trim()) return;
    setSaving(true);
    try {
      const email = user?.email ?? '';
      if (editingBadge) {
        const res = await fetch(`${API}/${editingBadge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: formImage,
            title: formTitle,
            description: formDescription,
            is_official: formIsOfficial,
            point: formPoint,
            is_active: formIsActive,
            updated_by: email,
          }),
        });
        if (res.ok) { setShowModal(false); await loadBadges(); }
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: formImage,
            title: formTitle,
            description: formDescription,
            is_official: formIsOfficial,
            point: formPoint,
            is_active: formIsActive,
            created_by: email,
          }),
        });
        if (res.ok) { setShowModal(false); await loadBadges(); }
      }
    } catch (err) {
      console.error('Failed to save badge', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (pendingDeleteId === null || saving) return;
    setSaving(true);
    try {
      const email = user?.email ?? '';
      const res = await fetch(`${API}/${pendingDeleteId}?updated_by=${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) await loadBadges();
    } catch (err) {
      console.error('Failed to delete badge', err);
    } finally {
      setSaving(false);
      setPendingDeleteId(null);
    }
  }

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configRecognitions" onNavigate={navigate} />

        <div className="admin-center-content">
          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h1 className="admin-breadcrumb-title">
                  <button className="admin-breadcrumb-link" onClick={() => navigate(ROUTES.adminConfigRecognitions)}>
                    Recognitions
                  </button>
                  <span>&gt;</span>
                  <span>Customize Recognition Badges</span>
                </h1>
              </div>
              <button className="admin-invite-btn" onClick={openAddModal}>Add Badge</button>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Is Official</th>
                    <th>Point</th>
                    <th>Is Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7} className="admin-empty-state">Loading...</td></tr>
                  )}
                  {!loading && totalRows === 0 && (
                    <tr><td colSpan={7} className="admin-empty-state">No recognition badges found.</td></tr>
                  )}
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.image ? (
                          <img src={row.image} alt={row.title} style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <span style={{ color: '#999' }}>—</span>
                        )}
                      </td>
                      <td>{row.title}</td>
                      <td>{row.description}</td>
                      <td>{row.is_official ? 'Yes' : 'No'}</td>
                      <td>{row.point}</td>
                      <td>{row.is_active ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit badge" onClick={() => openEditModal(row)}>
                            <PenSquare size={14} />
                          </button>
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete badge"
                            onClick={() => setPendingDeleteId(row.id)}
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

      {showModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>{editingBadge ? 'Edit Badge' : 'Add Badge'}</h2>
            </div>
            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <label>Badge Image (24×24)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {formImage && (
                    <img src={formImage} alt="Preview" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>
              <div className="admin-modal-field">
                <label>Title *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Badge title" />
              </div>
              <div className="admin-modal-field">
                <label>Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} placeholder="Badge description" />
              </div>
              <div className="admin-modal-field">
                <label>Point</label>
                <input type="number" value={formPoint} onChange={(e) => setFormPoint(Number(e.target.value))} min={0} />
              </div>
              <div className="admin-modal-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={formIsOfficial} onChange={(e) => setFormIsOfficial(e.target.checked)} />
                  Is Official (only HR can give this badge)
                </label>
              </div>
              <div className="admin-modal-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} />
                  Is Active
                </label>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingBadge ? 'Save Changes' : 'Add Badge'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={pendingDeleteId !== null}
        title="Delete Badge"
        message="Are you sure you want to delete this recognition badge? It will be deactivated."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}

export default AdminRecognitionBadgesPage;
