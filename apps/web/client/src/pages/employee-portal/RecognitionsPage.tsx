import { useCallback, useEffect, useState } from 'react';
import { Award, CalendarDays, Coins, Gift, Plus, X } from 'lucide-react';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { useAuth } from '../../app/AuthContext';
import './RecognitionsPage.css';

const API_BASE = '/api/v1';

type RecognitionTab = 'received' | 'given' | 'redeem';

type Badge = {
  id: number;
  image: string;
  title: string;
  description: string;
  is_official: boolean;
  point: number;
};

type RecognitionItem = {
  id: number;
  from_email: string;
  to_email: string;
  badge_title: string;
  badge_image: string;
  message: string;
  points: number;
  created_at: string | null;
  from_name: string;
  to_name: string;
};

type RewardCatalogItem = {
  id: number;
  reward_name: string;
  reward_description: string;
  redeem_points: number;
};

type RedeemedReward = {
  id: number;
  reward_name: string;
  reward_points: number;
  redeem_date: string | null;
  status: string;
  created_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US');
}

function RecognitionsPage() {
  const { hasRole, token } = useAuth();
  const isPrivileged = hasRole('Admin', 'HR');

  const [activeTab, setActiveTab] = useState<RecognitionTab>('received');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [received, setReceived] = useState<RecognitionItem[]>([]);
  const [given, setGiven] = useState<RecognitionItem[]>([]);
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [redeemed, setRedeemed] = useState<RedeemedReward[]>([]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rewardToConfirm, setRewardToConfirm] = useState<RewardCatalogItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<{ name: string; email: string }[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadData = useCallback(async () => {
    const includeOfficial = isPrivileged;
    const [bRes, recvRes, givenRes, ptsRes, rwRes, rdRes] = await Promise.all([
      fetch(`${API_BASE}/recognitions/badges?include_official=${includeOfficial}`),
      fetch(`${API_BASE}/recognitions/received`, { headers: authHeaders }),
      fetch(`${API_BASE}/recognitions/given`, { headers: authHeaders }),
      fetch(`${API_BASE}/recognitions/points`, { headers: authHeaders }),
      fetch(`${API_BASE}/rewards/catalog`),
      fetch(`${API_BASE}/rewards/my-redeems`, { headers: authHeaders }),
    ]);
    if (bRes.ok) setBadges(await bRes.json());
    if (recvRes.ok) setReceived(await recvRes.json());
    if (givenRes.ok) setGiven(await givenRes.json());
    if (ptsRes.ok) {
      const data = await ptsRes.json();
      setPoints(data.total ?? 0);
    }
    if (rwRes.ok) setRewards(await rwRes.json());
    if (rdRes.ok) setRedeemed(await rdRes.json());
  }, [token, isPrivileged]);

  useEffect(() => {
    if (token) loadData();
  }, [loadData, token]);

  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/feedback/users?q=${encodeURIComponent(userSearchQuery)}`, {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.items || []);
          setUserSearchResults(items);
          setShowUserDropdown(items.length > 0);
        }
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(timeout);
  }, [userSearchQuery]);

  function selectUser(u: { name: string; email: string }) {
    setToEmail(u.email);
    setUserSearchQuery(u.name);
    setShowUserDropdown(false);
  }

  async function handleSubmitRecognition() {
    if (!toEmail.trim() || selectedBadgeId === null || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/recognitions/give`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ to_email: toEmail, badge_id: selectedBadgeId, message }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setToEmail('');
        setUserSearchQuery('');
        setSelectedBadgeId(null);
        setMessage('');
        setActiveTab('given');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to give recognition', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmRedeem() {
    if (!rewardToConfirm || redeeming) return;
    setRedeeming(true);
    try {
      const res = await fetch(`${API_BASE}/rewards/${rewardToConfirm.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      });
      if (res.ok) {
        setRewardToConfirm(null);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to redeem reward', err);
    } finally {
      setRedeeming(false);
    }
  }

  const spentPoints = redeemed
    .filter((r) => r.status !== 'Rejected')
    .reduce((sum, r) => sum + r.reward_points, 0);
  const availablePoints = points - spentPoints;

  return (
    <section className="recognitions-page">
      <div className="recognitions-header-row">
        <div>
          <h1>Recognitions</h1>
          <p>Celebrate great work and redeem rewards with recognition points</p>
        </div>
        <button className="new-recognition-btn" onClick={() => setShowNewModal(true)}>
          <Plus size={16} />
          New Recognition
        </button>
      </div>

      <article className="points-summary-card">
        <div className="points-summary-title">
          <Coins size={18} />
          Recognition Points
        </div>
        <div className="points-summary-value">{availablePoints}</div>
        <p>Your total recognition points available for rewards redemption.</p>
      </article>

      <div className="recognitions-tabs">
        <button
          className={`recognitions-tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received
        </button>
        <button
          className={`recognitions-tab ${activeTab === 'given' ? 'active' : ''}`}
          onClick={() => setActiveTab('given')}
        >
          Given
        </button>
        <button
          className={`recognitions-tab ${activeTab === 'redeem' ? 'active' : ''}`}
          onClick={() => setActiveTab('redeem')}
        >
          Retrieve Points
        </button>
      </div>

      {activeTab === 'received' && (
        <div className="recognitions-list">
          {received.length === 0 && (
            <div className="recognitions-empty">
              <Award size={36} />
              <p>No recognitions received yet.</p>
            </div>
          )}
          {received.map((item) => (
            <article className="recognition-card" key={item.id}>
              <div className="recognition-card-header">
                <div className="recognition-title-row">
                  {item.badge_image ? (
                    <img src={item.badge_image} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                  ) : (
                    <Award size={18} />
                  )}
                  <h3>{item.badge_title}</h3>
                </div>
                <span className="recognition-date-pill">
                  <CalendarDays size={14} />
                  {formatDate(item.created_at)}
                </span>
              </div>
              <p>From: <strong>{item.from_name || item.from_email}</strong></p>
              {item.points > 0 && <p>Points: <strong>{item.points}</strong></p>}
              {item.message && <p>{item.message}</p>}
            </article>
          ))}
        </div>
      )}

      {activeTab === 'given' && (
        <div className="recognitions-list">
          {given.length === 0 && (
            <div className="recognitions-empty">
              <Award size={36} />
              <p>No recognitions given yet.</p>
            </div>
          )}
          {given.map((item) => (
            <article className="recognition-card" key={item.id}>
              <div className="recognition-card-header">
                <div className="recognition-title-row">
                  {item.badge_image ? (
                    <img src={item.badge_image} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                  ) : (
                    <Award size={18} />
                  )}
                  <h3>{item.badge_title}</h3>
                </div>
                <span className="recognition-date-pill">
                  <CalendarDays size={14} />
                  {formatDate(item.created_at)}
                </span>
              </div>
              <p>To: <strong>{item.to_name || item.to_email}</strong></p>
              {item.points > 0 && <p>Points: <strong>{item.points}</strong></p>}
              {item.message && <p>{item.message}</p>}
            </article>
          ))}
        </div>
      )}

      {activeTab === 'redeem' && (
        <section className="redeem-section">
          <div className="rewards-grid">
            {rewards.length === 0 && (
              <div className="recognitions-empty" style={{ gridColumn: '1 / -1' }}>
                <Gift size={36} />
                <p>No rewards available yet.</p>
              </div>
            )}
            {rewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <div className="reward-card-header">
                  <div className="reward-title-row">
                    <Gift size={18} />
                    <h3>{reward.reward_name}</h3>
                  </div>
                  <span className="reward-points-pill">{reward.redeem_points} pts</span>
                </div>
                <p>{reward.reward_description}</p>
                <button
                  className="redeem-btn"
                  onClick={() => setRewardToConfirm(reward)}
                  disabled={availablePoints < reward.redeem_points}
                >
                  {availablePoints < reward.redeem_points ? 'Not Enough Points' : 'Redeem Reward'}
                </button>
              </article>
            ))}
          </div>

          <article className="redeemed-history-card">
            <h3>Redeemed Rewards</h3>
            <div className="redeemed-list">
              {redeemed.length === 0 && (
                <div className="redeemed-list-item">No rewards redeemed yet.</div>
              )}
              {redeemed.map((reward) => (
                <div key={reward.id} className="redeemed-list-item">
                  {reward.reward_name} - {reward.reward_points} pts
                  (Redeemed {formatDate(reward.redeem_date || reward.created_at)})
                  <span className={`redeem-status-pill ${reward.status.toLowerCase()}`}>
                    {reward.status}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {showNewModal && (
        <div className="recognitions-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <section className="recognitions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recognitions-modal-header">
              <div>
                <h2>New Recognition</h2>
                <p>Send recognition to a teammate.</p>
              </div>
              <button
                className="recognitions-modal-close-btn"
                onClick={() => setShowNewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="recognitions-form-field">
              <label htmlFor="recognition-to">To</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="recognition-to"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setToEmail('');
                  }}
                  placeholder="Search by name or email..."
                  autoComplete="off"
                />
                {showUserDropdown && (
                  <div className="recognition-user-dropdown">
                    {userSearchResults.map((u) => (
                      <button
                        key={u.email}
                        className="recognition-user-option"
                        onClick={() => selectUser(u)}
                      >
                        <span className="recognition-user-option-name">{u.name}</span>
                        <span className="recognition-user-option-email">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="recognitions-form-field">
              <label>Select a Badge</label>
              <div className="badge-grid">
                {badges.map((badge) => (
                  <button
                    key={badge.id}
                    className={`badge-card ${selectedBadgeId === badge.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBadgeId(badge.id)}
                  >
                    {badge.image ? (
                      <img src={badge.image} alt="" className="badge-icon-img" />
                    ) : (
                      <span className="badge-icon">🏅</span>
                    )}
                    <span className="badge-label">{badge.title}</span>
                    {badge.point > 0 && <span className="badge-points">{badge.point} pts</span>}
                    {badge.is_official && (
                      <span className="badge-special-note">Official - HR/Admin only</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="recognitions-form-field">
              <label htmlFor="recognition-message">Message</label>
              <textarea
                id="recognition-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="You may enter a message here (optional)"
                rows={5}
              />
            </div>

            <div className="recognitions-form-actions">
              <button className="recognitions-secondary-btn" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button
                className="recognitions-primary-btn"
                onClick={handleSubmitRecognition}
                disabled={submitting || !toEmail.trim() || selectedBadgeId === null}
              >
                {submitting ? 'Sending...' : 'Send Recognition'}
              </button>
            </div>
          </section>
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(rewardToConfirm)}
        title="Confirm Reward Redemption"
        message={
          rewardToConfirm
            ? `Are you sure you want to redeem "${rewardToConfirm.reward_name}" for ${rewardToConfirm.redeem_points} points?`
            : ''
        }
        confirmLabel={redeeming ? 'Redeeming...' : 'Redeem'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmRedeem}
        onCancel={() => setRewardToConfirm(null)}
      />
    </section>
  );
}

export default RecognitionsPage;
