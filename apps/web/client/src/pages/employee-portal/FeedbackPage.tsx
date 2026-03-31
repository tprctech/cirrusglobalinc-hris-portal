import { useState } from 'react';
import { CalendarDays, MessageSquare, Plus, X } from 'lucide-react';
import { feedbackMockData } from '../../data/mock/menuMockData';
import './FeedbackPage.css';

type FeedbackTab = 'received' | 'given';

type ReceivedFeedback = {
  id: string;
  title: string;
  from: string;
  date: string;
  description: string;
};

type GivenFeedback = {
  id: string;
  title: string;
  to: string;
  date: string;
  description: string;
};

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US');
}

function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('received');
  const [showNewFeedbackModal, setShowNewFeedbackModal] = useState(false);
  const [to, setTo] = useState(feedbackMockData.recipients[0] ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [givenFeedback, setGivenFeedback] = useState<GivenFeedback[]>(
    feedbackMockData.tabs.given as GivenFeedback[],
  );

  const receivedFeedback = feedbackMockData.tabs.received as ReceivedFeedback[];

  function handleSubmitFeedback() {
    if (!to.trim() || !title.trim() || !description.trim()) {
      return;
    }

    const payload = {
      to,
      title,
      description,
    };

    // Placeholder until backend API is connected.
    console.log('new_feedback_payload', payload);

    setGivenFeedback((previous) => [
      {
        id: `given-${Date.now()}`,
        to,
        title,
        description,
        date: formatDateForDisplay(new Date()),
      },
      ...previous,
    ]);
    setTitle('');
    setDescription('');
    setShowNewFeedbackModal(false);
    setActiveTab('given');
  }

  return (
    <section className="feedback-page">
      <div className="feedback-header-row">
        <div>
          <h1>{feedbackMockData.pageTitle}</h1>
          <p>{feedbackMockData.subtitle}</p>
        </div>
        <button className="new-feedback-btn" onClick={() => setShowNewFeedbackModal(true)}>
          <Plus size={16} />
          New Feedback
        </button>
      </div>

      <div className="feedback-tabs">
        <button
          className={`feedback-tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received
        </button>
        <button
          className={`feedback-tab ${activeTab === 'given' ? 'active' : ''}`}
          onClick={() => setActiveTab('given')}
        >
          Given
        </button>
      </div>

      <div className="feedback-list">
        {activeTab === 'received' && receivedFeedback.map((item) => (
          <article className="feedback-card" key={item.id}>
            <div className="feedback-card-header">
              <div className="feedback-title-row">
                <MessageSquare size={18} />
                <h3>{item.title}</h3>
              </div>
              <span className="feedback-date-pill">
                <CalendarDays size={14} />
                {item.date}
              </span>
            </div>
            <p>From: <strong>{item.from}</strong></p>
            <p>{item.description}</p>
          </article>
        ))}

        {activeTab === 'given' && givenFeedback.map((item) => (
          <article className="feedback-card" key={item.id}>
            <div className="feedback-card-header">
              <div className="feedback-title-row">
                <MessageSquare size={18} />
                <h3>{item.title}</h3>
              </div>
              <span className="feedback-date-pill">
                <CalendarDays size={14} />
                {item.date}
              </span>
            </div>
            <p>To: <strong>{item.to}</strong></p>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      {showNewFeedbackModal && (
        <div className="feedback-modal-backdrop">
          <section className="feedback-modal" onClick={(event) => event.stopPropagation()}>
            <div className="feedback-modal-header">
              <div>
                <h2>New Feedback</h2>
                <p>Share constructive feedback with a teammate.</p>
              </div>
              <button className="feedback-modal-close-btn" onClick={() => setShowNewFeedbackModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="feedback-form-field">
              <label htmlFor="feedback-to">To</label>
              <select id="feedback-to" value={to} onChange={(event) => setTo(event.target.value)}>
                {feedbackMockData.recipients.map((recipient) => (
                  <option key={recipient} value={recipient}>
                    {recipient}
                  </option>
                ))}
              </select>
            </div>

            <div className="feedback-form-field">
              <label htmlFor="feedback-title">Title</label>
              <input
                id="feedback-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="feedback-form-field">
              <label htmlFor="feedback-description">Description</label>
              <textarea
                id="feedback-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
              />
            </div>

            <div className="feedback-form-actions">
              <button className="feedback-secondary-btn" onClick={() => setShowNewFeedbackModal(false)}>
                Cancel
              </button>
              <button className="feedback-primary-btn" onClick={handleSubmitFeedback}>
                Submit Feedback
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default FeedbackPage;

