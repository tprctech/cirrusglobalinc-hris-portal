import { useCallback, useEffect, useMemo, useState } from 'react';
import { PenSquare, Search, Trash2 } from 'lucide-react';
import AdminCenterSidebar from '../../../../components/AdminCenterSidebar';
import AdminTablePagination from '../../../../components/AdminTablePagination';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import { useAuth } from '../../../../app/AuthContext';
import '../../AdminCenterPage.css';

type AdminRecognitionsConfigPageProps = {
  onNavigate?: (path: string) => void;
};

type RedeemStatus = 'Pending' | 'Approved' | 'Rejected';

type BadgeRow = {
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

type RewardRow = {
  id: number;
  reward_name: string;
  reward_description: string;
  redeem_points: number;
  is_active: boolean;
  created_by: string;
  updated_by: string;
};

type RedeemRow = {
  id: number;
  requested_by: string;
  user_mail: string;
  reward_name: string;
  reward_points: number;
  redeem_date: string | null;
  status: string;
};

const BASE = '/api/v1/hr/recognitions';
const PAGE_SIZE = 8;

function AdminRecognitionsConfigPage({ onNavigate }: AdminRecognitionsConfigPageProps) {
  const { user } = useAuth();
  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [badgePage, setBadgePage] = useState(1);
  const [pendingDeleteBadgeId, setPendingDeleteBadgeId] = useState<number | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeRow | null>(null);
  const [badgeForm, setBadgeForm] = useState({ image: '', title: '', description: '', is_official: false, point: 0, is_active: true });

  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [rewardPage, setRewardPage] = useState(1);
  const [pendingDeleteRewardId, setPendingDeleteRewardId] = useState<number | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardRow | null>(null);
  const [rewardForm, setRewardForm] = useState({ reward_name: '', reward_description: '', redeem_points: 0, is_active: true });

  const [redeems, setRedeems] = useState<RedeemRow[]>([]);
  const [redeemTab, setRedeemTab] = useState<RedeemStatus>('Pending');
  const [redeemPage, setRedeemPage] = useState(1);
  const [redeemSearch, setRedeemSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [bRes, rRes, dRes] = await Promise.all([
        fetch(`${BASE}/badges`),
        fetch(`${BASE}/rewards`),
        fetch(`${BASE}/redeems`),
      ]);
      if (bRes.ok) setBadges(await bRes.json());
      if (rRes.ok) setRewards(await rRes.json());
      if (dRes.ok) setRedeems(await dRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const badgeTotalPages = Math.max(1, Math.ceil(badges.length / PAGE_SIZE));
  const badgeSafePage = Math.min(badgePage, badgeTotalPages);
  const badgePagedRows = badges.slice((badgeSafePage - 1) * PAGE_SIZE, badgeSafePage * PAGE_SIZE);

  const rewardTotalPages = Math.max(1, Math.ceil(rewards.length / PAGE_SIZE));
  const rewardSafePage = Math.min(rewardPage, rewardTotalPages);
  const rewardPagedRows = rewards.slice((rewardSafePage - 1) * PAGE_SIZE, rewardSafePage * PAGE_SIZE);

  const filteredRedeems = useMemo(() => {
    let items = redeems.filter((item) => item.status === redeemTab);
    if (redeemSearch.trim()) {
      const q = redeemSearch.trim().toLowerCase();
      items = items.filter((item) => item.requested_by.toLowerCase().includes(q));
    }
    return items;
  }, [redeems, redeemTab, redeemSearch]);
  const redeemTotalPages = Math.max(1, Math.ceil(filteredRedeems.length / PAGE_SIZE));
  const redeemSafePage = Math.min(redeemPage, redeemTotalPages);
  const redeemPagedRows = filteredRedeems.slice((redeemSafePage - 1) * PAGE_SIZE, redeemSafePage * PAGE_SIZE);

  function openCreateBadge() {
    setEditingBadge(null);
    setBadgeForm({ image: '', title: '', description: '', is_official: false, point: 0, is_active: true });
    setShowBadgeModal(true);
  }

  function openEditBadge(badge: BadgeRow) {
    setEditingBadge(badge);
    setBadgeForm({ image: badge.image, title: badge.title, description: badge.description, is_official: badge.is_official, point: badge.point, is_active: badge.is_active });
    setShowBadgeModal(true);
  }

  function handleBadgeImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
          setBadgeForm((p) => ({ ...p, image: canvas.toDataURL('image/png') }));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveBadge() {
    if (saving) return;
    setSaving(true);
    const email = user?.email ?? '';
    try {
      if (editingBadge) {
        const res = await fetch(`${BASE}/badges/${editingBadge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...badgeForm, updated_by: email }),
        });
        if (!res.ok) throw new Error('Failed');
      } else {
        const res = await fetch(`${BASE}/badges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...badgeForm, created_by: email }),
        });
        if (!res.ok) throw new Error('Failed');
      }
      setShowBadgeModal(false);
      await loadAll();
    } catch (err) {
      console.error('Failed to save badge', err);
    } finally {
      setSaving(false);
    }
  }

  function openCreateReward() {
    setEditingReward(null);
    setRewardForm({ reward_name: '', reward_description: '', redeem_points: 0, is_active: true });
    setShowRewardModal(true);
  }

  function openEditReward(reward: RewardRow) {
    setEditingReward(reward);
    setRewardForm({ reward_name: reward.reward_name, reward_description: reward.reward_description, redeem_points: reward.redeem_points, is_active: reward.is_active });
    setShowRewardModal(true);
  }

  async function handleSaveReward() {
    if (saving) return;
    setSaving(true);
    const email = user?.email ?? '';
    try {
      if (editingReward) {
        const res = await fetch(`${BASE}/rewards/${editingReward.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rewardForm, updated_by: email }),
        });
        if (!res.ok) throw new Error('Failed');
      } else {
        const res = await fetch(`${BASE}/rewards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rewardForm, created_by: email }),
        });
        if (!res.ok) throw new Error('Failed');
      }
      setShowRewardModal(false);
      await loadAll();
    } catch (err) {
      console.error('Failed to save reward', err);
    } finally {
      setSaving(false);
    }
  }

  async function updateRedeemStatus(id: number, status: Exclude<RedeemStatus, 'Pending'>) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/redeems/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await loadAll();
    } catch { /* ignore */ }
    setSaving(false);
  }

  function formatDate(d: string | null): string {
    if (!d) return '—';
    const [year, month, day] = d.split('-');
    if (!year || !month || !day) return d;
    return `${Number(month)}/${Number(day)}/${year}`;
  }

  if (loading) {
    return (
      <section className="admin-center-page">
        <div className="admin-center-shell">
          <AdminCenterSidebar activeMenu="configRecognitions" onNavigate={navigate} />
          <div className="admin-center-content">
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configRecognitions" onNavigate={navigate} />

        <div className="admin-center-content">
          <div className="admin-users-toolbar">
            <div>
              <h1>Configuration &gt; Recognitions</h1>
              <p>Manage admin-side settings for the employee portal Recognitions module.</p>
            </div>
          </div>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Customize Recognition Badges</h2></div>
              <button className="admin-invite-btn" onClick={openCreateBadge}>Add</button>
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
                  {badgePagedRows.length === 0 && (
                    <tr><td colSpan={7} className="admin-empty-state">No badges yet.</td></tr>
                  )}
                  {badgePagedRows.map((row) => (
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
                          <button className="admin-icon-action-btn" title="Edit badge" onClick={() => openEditBadge(row)}>
                            <PenSquare size={14} />
                          </button>
                          <button className="admin-icon-action-btn danger" title="Delete badge" onClick={() => setPendingDeleteBadgeId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={badgeSafePage} totalItems={badges.length} pageSize={PAGE_SIZE} onPageChange={setBadgePage} />
          </section>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Manage Rewards</h2></div>
              <button className="admin-invite-btn" onClick={openCreateReward}>Create New Reward</button>
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
                  {rewardPagedRows.length === 0 && (
                    <tr><td colSpan={5} className="admin-empty-state">No rewards yet.</td></tr>
                  )}
                  {rewardPagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reward_name}</td>
                      <td>{row.reward_description}</td>
                      <td>{row.redeem_points}</td>
                      <td>{row.is_active ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-icon-action-btn" title="Edit reward" onClick={() => openEditReward(row)}>
                            <PenSquare size={14} />
                          </button>
                          <button className="admin-icon-action-btn danger" title="Delete reward" onClick={() => setPendingDeleteRewardId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={rewardSafePage} totalItems={rewards.length} pageSize={PAGE_SIZE} onPageChange={setRewardPage} />
          </section>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div><h2>Manage Reward Redeems</h2></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="admin-tab-list" role="tablist" aria-label="Redeem status tabs" style={{ flex: 1 }}>
                {(['Pending', 'Approved', 'Rejected'] as RedeemStatus[]).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={redeemTab === tab}
                    className={`admin-tab-btn ${redeemTab === tab ? 'active' : ''}`}
                    onClick={() => { setRedeemTab(tab); setRedeemPage(1); }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="text"
                  placeholder="Search by Requested By..."
                  value={redeemSearch}
                  onChange={(e) => { setRedeemSearch(e.target.value); setRedeemPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 30px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Requested By</th>
                    <th>Requested By Email</th>
                    <th>Reward Name</th>
                    <th>Reward Points</th>
                    <th>Redeem Date</th>
                    {redeemTab === 'Pending' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRedeems.length === 0 && (
                    <tr>
                      <td colSpan={redeemTab === 'Pending' ? 6 : 5} className="admin-empty-state">
                        No {redeemTab.toLowerCase()} redeems found.
                      </td>
                    </tr>
                  )}
                  {redeemPagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.requested_by}</td>
                      <td>{row.user_mail}</td>
                      <td>{row.reward_name}</td>
                      <td>{row.reward_points}</td>
                      <td>{formatDate(row.redeem_date)}</td>
                      {redeemTab === 'Pending' && (
                        <td>
                          <div className="admin-actions-cell">
                            <button className="admin-compact-action-btn approve" disabled={saving} onClick={() => updateRedeemStatus(row.id, 'Approved')}>
                              Approve
                            </button>
                            <button className="admin-compact-action-btn reject" disabled={saving} onClick={() => updateRedeemStatus(row.id, 'Rejected')}>
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination currentPage={redeemSafePage} totalItems={filteredRedeems.length} pageSize={PAGE_SIZE} onPageChange={setRedeemPage} />
          </section>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteBadgeId)}
        title="Delete Badge"
        message="Are you sure you want to delete this recognition badge? It will be deactivated."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteBadgeId(null)}
        onConfirm={async () => {
          if (pendingDeleteBadgeId) {
            const email = user?.email ?? '';
            await fetch(`${BASE}/badges/${pendingDeleteBadgeId}?updated_by=${encodeURIComponent(email)}`, { method: 'DELETE' });
            await loadAll();
          }
          setPendingDeleteBadgeId(null);
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteRewardId)}
        title="Delete Reward"
        message="Are you sure you want to delete this reward? It will be deactivated."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteRewardId(null)}
        onConfirm={async () => {
          if (pendingDeleteRewardId) {
            const email = user?.email ?? '';
            await fetch(`${BASE}/rewards/${pendingDeleteRewardId}?updated_by=${encodeURIComponent(email)}`, { method: 'DELETE' });
            await loadAll();
          }
          setPendingDeleteRewardId(null);
        }}
      />

      {showBadgeModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h2>{editingBadge ? 'Edit Badge' : 'Add Badge'}</h2>
            </div>
            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <label>Badge Image (24x24)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {badgeForm.image && (
                    <img src={badgeForm.image} alt="Preview" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                  )}
                  <input type="file" accept="image/*" onChange={handleBadgeImageUpload} />
                </div>
              </div>
              <div className="admin-modal-field">
                <label>Title *</label>
                <input value={badgeForm.title} onChange={(e) => setBadgeForm((p) => ({ ...p, title: e.target.value }))} placeholder="Badge title" />
              </div>
              <div className="admin-modal-field">
                <label>Description</label>
                <textarea value={badgeForm.description} onChange={(e) => setBadgeForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Badge description" />
              </div>
              <div className="admin-modal-field">
                <label>Point</label>
                <input type="number" value={badgeForm.point} onChange={(e) => setBadgeForm((p) => ({ ...p, point: Number(e.target.value) }))} min={0} />
              </div>
              <div className="admin-modal-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={badgeForm.is_official} onChange={(e) => setBadgeForm((p) => ({ ...p, is_official: e.target.checked }))} />
                  Is Official (only HR can give this badge)
                </label>
              </div>
              <div className="admin-modal-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={badgeForm.is_active} onChange={(e) => setBadgeForm((p) => ({ ...p, is_active: e.target.checked }))} />
                  Is Active
                </label>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowBadgeModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveBadge} disabled={saving || !badgeForm.title.trim()}>
                {saving ? 'Saving...' : 'Save Badge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRewardModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h2>{editingReward ? 'Edit Reward' : 'Create Reward'}</h2>
            </div>
            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <label>Reward Name *</label>
                <input value={rewardForm.reward_name} onChange={(e) => setRewardForm((p) => ({ ...p, reward_name: e.target.value }))} placeholder="Reward name" />
              </div>
              <div className="admin-modal-field">
                <label>Reward Description</label>
                <textarea value={rewardForm.reward_description} onChange={(e) => setRewardForm((p) => ({ ...p, reward_description: e.target.value }))} rows={3} placeholder="Reward description" />
              </div>
              <div className="admin-modal-field">
                <label>Redeem Points</label>
                <input type="number" value={rewardForm.redeem_points} onChange={(e) => setRewardForm((p) => ({ ...p, redeem_points: Number(e.target.value) }))} min={0} />
              </div>
              <div className="admin-modal-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={rewardForm.is_active} onChange={(e) => setRewardForm((p) => ({ ...p, is_active: e.target.checked }))} />
                  Is Active
                </label>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary-btn" onClick={() => setShowRewardModal(false)}>Cancel</button>
              <button className="admin-primary-btn" onClick={handleSaveReward} disabled={saving || !rewardForm.reward_name.trim()}>
                {saving ? 'Saving...' : 'Save Reward'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminRecognitionsConfigPage;
