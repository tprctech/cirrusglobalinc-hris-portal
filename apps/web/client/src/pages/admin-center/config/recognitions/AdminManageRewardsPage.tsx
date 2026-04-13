import { useCallback, useEffect, useState } from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import { useAuth } from '../../../../app/AuthContext';
import { ROUTES } from '../../../../app/routes';
import '../../AdminCenterPage.css';

type AdminManageRewardsPageProps = {
  onNavigate?: (path: string) => void;
};

type Reward = {
  id: number;
  reward_name: string;
  reward_description: string;
  redeem_points: number;
  is_active: boolean;
  created_by: string;
  updated_by: string;
};

const API = '/api/v1/hr/recognitions/rewards';
const PAGE_SIZE = 8;

function AdminManageRewardsPage({ onNavigate }: AdminManageRewardsPageProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRedeemPoints, setFormRedeemPoints] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const loadRewards = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (res.ok) setRows(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadRewards(); }, [loadRewards]);

  function openAddModal() {
    setEditingReward(null);
    setFormName('');
    setFormDescription('');
    setFormRedeemPoints(0);
    setFormIsActive(true);
    setShowModal(true);
  }

  function openEditModal(reward: Reward) {
    setEditingReward(reward);
    setFormName(reward.reward_name);
    setFormDescription(reward.reward_description);
    setFormRedeemPoints(reward.redeem_points);
    setFormIsActive(reward.is_active);
    setShowModal(true);
  }

  async function handleSave() {
    if (saving || !formName.trim()) return;
    setSaving(true);
    try {
      const email = user?.email ?? '';
      if (editingReward) {
        const res = await fetch(`${API}/${editingReward.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reward_name: formName,
            reward_description: formDescription,
            redeem_points: formRedeemPoints,
            is_active: formIsActive,
            updated_by: email,
          }),
        });
        if (res.ok) { setShowModal(false); await loadRewards(); }
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reward_name: formName,
            reward_description: formDescription,
            redeem_points: formRedeemPoints,
            is_active: formIsActive,
            created_by: email,
          }),
        });
        if (res.ok) { setShowModal(false); await loadRewards(); }
      }
    } catch (err) {
      console.error('Failed to save reward', err);
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
      if (res.ok || res.status === 204) await loadRewards();
    } catch (err) {
      console.error('Failed to delete reward', err);
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
                  <span>Manage Rewards</span>
                </h1>
              </div>
              <button className="admin-invite-btn" onClick={openAddModal}>Create New Reward</button>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Reward Name</th>
                    <th>Reward Description</th>
                    <th>Redeem Points</th>
                    <th>Is Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={5} className="admin-empty-state">Loading...</td></tr>
                  )}
                  {!loading && totalRows === 0 && (
                    <tr><td colSpan={5} className="admin-empty-state">No rewards found.</td></tr>
                  )}
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reward_name}</td>
                      <td>{row.reward_description}</td>
                      <td>{row.redeem_points}</td>
                      <td>{row.is_active ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit reward" onClick={() => openEditModal(row)}>
                            <PenSquare size={14} />
                          </button>
                          <button
                            className="admin-icon-action-btn danger"
                            title="Delete reward"
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
              <h2>{editingReward ? 'Edit Reward' : 'Create New Reward'}</h2>
            </div>
            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <label>Reward Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Reward name" />
              </div>
              <div className="admin-modal-field">
                <label>Reward Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} placeholder="Reward description" />
              </div>
              <div className="admin-modal-field">
                <label>Redeem Points</label>
                <input type="number" value={formRedeemPoints} onChange={(e) => setFormRedeemPoints(Number(e.target.value))} min={0} />
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
                {saving ? 'Saving...' : editingReward ? 'Save Changes' : 'Create Reward'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={pendingDeleteId !== null}
        title="Delete Reward"
        message="Are you sure you want to delete this reward? It will be deactivated."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}

export default AdminManageRewardsPage;
