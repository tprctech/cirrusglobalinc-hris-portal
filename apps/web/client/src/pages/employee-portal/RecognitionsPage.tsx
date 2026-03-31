import { useState } from 'react';
import { Award, CalendarDays, Coins, Gift, Plus, X } from 'lucide-react';
import { recognitionsMockData } from '../../data/mock/menuMockData';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import './RecognitionsPage.css';

type RecognitionTab = 'received' | 'given' | 'redeem';

type Badge = {
  id: string;
  label: string;
  icon: string;
  points: number;
  special: boolean;
};

type ReceivedRecognition = {
  id: string;
  badgeId: string;
  badgeLabel: string;
  from: string;
  date: string;
  message: string;
};

type GivenRecognition = {
  id: string;
  badgeId: string;
  badgeLabel: string;
  to: string;
  date: string;
  message: string;
  points: number;
};

type Reward = {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
};

type RedeemedReward = {
  id: string;
  name: string;
  pointsCost: number;
  redeemedDate: string;
};

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US');
}

function RecognitionsPage() {
  const [activeTab, setActiveTab] = useState<RecognitionTab>('received');
  const [showNewRecognitionModal, setShowNewRecognitionModal] = useState(false);
  const [to, setTo] = useState(recognitionsMockData.recipients[0] ?? '');
  const [selectedBadgeId, setSelectedBadgeId] = useState(recognitionsMockData.badges[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [recognitionPoints, setRecognitionPoints] = useState(recognitionsMockData.recognitionPoints);
  const [givenRecognitions, setGivenRecognitions] = useState<GivenRecognition[]>(
    recognitionsMockData.tabs.given as GivenRecognition[],
  );
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>(
    recognitionsMockData.redeemedRewards as RedeemedReward[],
  );
  const [rewardToConfirm, setRewardToConfirm] = useState<Reward | null>(null);

  const badges = recognitionsMockData.badges as Badge[];
  const receivedRecognitions = recognitionsMockData.tabs.received as ReceivedRecognition[];
  const rewards = recognitionsMockData.redeemRewards as Reward[];

  function canSelectBadge(badge: Badge) {
    if (!badge.special) {
      return true;
    }
    return recognitionsMockData.permissions.canGiveSpecialBadge;
  }

  function handleSubmitRecognition() {
    if (!to.trim() || !selectedBadgeId) {
      return;
    }

    const badge = badges.find((item) => item.id === selectedBadgeId);
    if (!badge || !canSelectBadge(badge)) {
      return;
    }

    const payload = {
      to,
      badgeId: badge.id,
      badgeLabel: badge.label,
      points: badge.points,
      message,
    };

    // Placeholder until backend API is connected.
    console.log('new_recognition_payload', payload);

    setGivenRecognitions((previous) => [
      {
        id: `given-${Date.now()}`,
        badgeId: badge.id,
        badgeLabel: badge.label,
        to,
        date: formatDateForDisplay(new Date()),
        message: message.trim() || 'Recognition shared.',
        points: badge.points,
      },
      ...previous,
    ]);
    setMessage('');
    setShowNewRecognitionModal(false);
    setActiveTab('given');
  }

  function openRedeemConfirmation(reward: Reward) {
    if (recognitionPoints < reward.pointsCost) {
      return;
    }

    setRewardToConfirm(reward);
  }

  function handleConfirmRedeem() {
    if (!rewardToConfirm) {
      return;
    }

    setRecognitionPoints((previous) => previous - rewardToConfirm.pointsCost);
    setRedeemedRewards((previous) => [
      {
        id: `redeemed-${Date.now()}`,
        name: rewardToConfirm.name,
        pointsCost: rewardToConfirm.pointsCost,
        redeemedDate: formatDateForDisplay(new Date()),
      },
      ...previous,
    ]);

    // Placeholder until backend API is connected.
    console.log('redeem_reward_payload', {
      rewardId: rewardToConfirm.id,
      pointsCost: rewardToConfirm.pointsCost,
    });
    setRewardToConfirm(null);
  }

  function handleCancelRedeem() {
    setRewardToConfirm(null);
  }

  return (
    <section className="recognitions-page">
      <div className="recognitions-header-row">
        <div>
          <h1>{recognitionsMockData.pageTitle}</h1>
          <p>{recognitionsMockData.subtitle}</p>
        </div>
        <button className="new-recognition-btn" onClick={() => setShowNewRecognitionModal(true)}>
          <Plus size={16} />
          New Recognition
        </button>
      </div>

      <article className="points-summary-card">
        <div className="points-summary-title">
          <Coins size={18} />
          Recognition Points
        </div>
        <div className="points-summary-value">{recognitionPoints}</div>
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
          {receivedRecognitions.map((item) => (
            <article className="recognition-card" key={item.id}>
              <div className="recognition-card-header">
                <div className="recognition-title-row">
                  <Award size={18} />
                  <h3>{item.badgeLabel}</h3>
                </div>
                <span className="recognition-date-pill">
                  <CalendarDays size={14} />
                  {item.date}
                </span>
              </div>
              <p>From: <strong>{item.from}</strong></p>
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'given' && (
        <div className="recognitions-list">
          {givenRecognitions.map((item) => (
            <article className="recognition-card" key={item.id}>
              <div className="recognition-card-header">
                <div className="recognition-title-row">
                  <Award size={18} />
                  <h3>{item.badgeLabel}</h3>
                </div>
                <span className="recognition-date-pill">
                  <CalendarDays size={14} />
                  {item.date}
                </span>
              </div>
              <p>To: <strong>{item.to}</strong></p>
              {item.points > 0 && <p>Recognition Points: <strong>{item.points}</strong></p>}
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'redeem' && (
        <section className="redeem-section">
          <div className="rewards-grid">
            {rewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <div className="reward-card-header">
                  <div className="reward-title-row">
                    <Gift size={18} />
                    <h3>{reward.name}</h3>
                  </div>
                  <span className="reward-points-pill">{reward.pointsCost} pts</span>
                </div>
                <p>{reward.description}</p>
                <button
                  className="redeem-btn"
                  onClick={() => openRedeemConfirmation(reward)}
                  disabled={recognitionPoints < reward.pointsCost}
                >
                  {recognitionPoints < reward.pointsCost ? 'Not Enough Points' : 'Redeem Reward'}
                </button>
              </article>
            ))}
          </div>

          <article className="redeemed-history-card">
            <h3>Redeemed Rewards</h3>
            <div className="redeemed-list">
              {redeemedRewards.map((reward) => (
                <div key={reward.id} className="redeemed-list-item">
                  {reward.name} - {reward.pointsCost} pts (Redeemed {reward.redeemedDate})
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {showNewRecognitionModal && (
        <div className="recognitions-modal-backdrop">
          <section className="recognitions-modal" onClick={(event) => event.stopPropagation()}>
            <div className="recognitions-modal-header">
              <div>
                <h2>New Recognition</h2>
                <p>Send recognition to a teammate.</p>
              </div>
              <button
                className="recognitions-modal-close-btn"
                onClick={() => setShowNewRecognitionModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="recognitions-form-field">
              <label htmlFor="recognition-to">To</label>
              <input
                id="recognition-to"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="Type the name of the person"
                list="recognition-recipients"
              />
              <datalist id="recognition-recipients">
                {recognitionsMockData.recipients.map((recipient) => (
                  <option key={recipient} value={recipient} />
                ))}
              </datalist>
            </div>

            <div className="recognitions-form-field">
              <label>Select a Badge</label>
              <div className="badge-grid">
                {badges.map((badge) => {
                  const disabled = !canSelectBadge(badge);
                  return (
                    <button
                      key={badge.id}
                      className={`badge-card ${selectedBadgeId === badge.id ? 'selected' : ''}`}
                      onClick={() => !disabled && setSelectedBadgeId(badge.id)}
                      disabled={disabled}
                    >
                      <span className="badge-icon">{badge.icon}</span>
                      <span className="badge-label">{badge.label}</span>
                      {badge.points > 0 && <span className="badge-points">{badge.points} pts</span>}
                      {disabled && (
                        <span className="badge-special-note">
                          {recognitionsMockData.labels.specialBadgeOnlyFor}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="recognitions-form-field">
              <label htmlFor="recognition-message">Message</label>
              <textarea
                id="recognition-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="You may enter a message here (optional)"
                rows={5}
              />
            </div>

            <div className="recognitions-form-actions">
              <button className="recognitions-secondary-btn" onClick={() => setShowNewRecognitionModal(false)}>
                Cancel
              </button>
              <button className="recognitions-primary-btn" onClick={handleSubmitRecognition}>
                Send Recognition
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
            ? `Are you sure you want to redeem "${rewardToConfirm.name}" for ${rewardToConfirm.pointsCost} points?`
            : ''
        }
        confirmLabel="Redeem"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRedeem}
        onCancel={handleCancelRedeem}
      />
    </section>
  );
}

export default RecognitionsPage;

