import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Loader2, MessageSquare, Plus, X } from 'lucide-react';
import { getStoredToken } from '../../api/auth';
import './FeedbackPage.css';

type FeedbackTab = 'received' | 'given';

type ReceivedFeedback = {
  id: number;
  title: string;
  from: string;
  fromEmail: string;
  fromPhoto: string;
  date: string;
  description: string;
};

type GivenFeedback = {
  id: number;
  title: string;
  to: string;
  toEmail: string;
  toPhoto: string;
  date: string;
  description: string;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

type UserOption = {
  id: number;
  name: string;
  email: string;
};

function UserSearchDropdown({
  selectedUser,
  onSelect,
}: {
  selectedUser: UserOption | null;
  onSelect: (user: UserOption | null) => void;
}) {
  const [query, setQuery] = useState(selectedUser ? selectedUser.name : '');
  const [results, setResults] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    fetch(`/api/v1/feedback/users?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setResults(data.items || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    onSelect(null);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  }

  function handleFocus() {
    setOpen(true);
    doSearch(query);
  }

  function handleSelect(user: UserOption) {
    setQuery(user.name);
    onSelect(user);
    setOpen(false);
  }

  return (
    <div className="feedback-user-search" ref={containerRef}>
      <input
        placeholder="Search for a user..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
      />
      {open && (
        <div className="feedback-user-dropdown">
          {loading && <div className="feedback-user-loading">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="feedback-user-empty">No users found</div>
          )}
          {!loading &&
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                className="feedback-user-option"
                onClick={() => handleSelect(u)}
              >
                <span className="feedback-user-option-name">{u.name}</span>
                <span className="feedback-user-option-email">{u.email}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('received');
  const [showNewFeedbackModal, setShowNewFeedbackModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [receivedFeedback, setReceivedFeedback] = useState<ReceivedFeedback[]>([]);
  const [givenFeedback, setGivenFeedback] = useState<GivenFeedback[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingGiven, setLoadingGiven] = useState(true);

  const fetchReceived = useCallback(() => {
    const token = getStoredToken();
    if (!token) { setLoadingReceived(false); return; }
    setLoadingReceived(true);
    fetch('/api/v1/feedback/received', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setReceivedFeedback(data.items || []))
      .catch(() => {})
      .finally(() => setLoadingReceived(false));
  }, []);

  const fetchGiven = useCallback(() => {
    const token = getStoredToken();
    if (!token) { setLoadingGiven(false); return; }
    setLoadingGiven(true);
    fetch('/api/v1/feedback/given', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setGivenFeedback(data.items || []))
      .catch(() => {})
      .finally(() => setLoadingGiven(false));
  }, []);

  useEffect(() => {
    fetchReceived();
    fetchGiven();
  }, [fetchReceived, fetchGiven]);

  function handleSubmitFeedback() {
    if (!selectedUser || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    setSubmitError('');

    const token = getStoredToken();
    if (!token) { setSubmitError('Not authenticated'); setSubmitting(false); return; }

    fetch('/api/v1/feedback/employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to_user_id: selectedUser.id,
        title: title.trim(),
        description,
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ detail: 'Failed to submit feedback' }));
          throw new Error(err.detail || 'Failed to submit feedback');
        }
        return r.json();
      })
      .then(() => {
        setTitle('');
        setDescription('');
        setSelectedUser(null);
        setShowNewFeedbackModal(false);
        setActiveTab('given');
        fetchGiven();
        fetchReceived();
      })
      .catch((err) => setSubmitError(err.message))
      .finally(() => setSubmitting(false));
  }

  function openModal() {
    setTitle('');
    setDescription('');
    setSelectedUser(null);
    setSubmitError('');
    setShowNewFeedbackModal(true);
  }

  const isLoading = activeTab === 'received' ? loadingReceived : loadingGiven;
  const currentList = activeTab === 'received' ? receivedFeedback : givenFeedback;

  return (
    <section className="feedback-page">
      <div className="feedback-header-row">
        <div>
          <h1>Feedback</h1>
          <p>Track feedback you have received and feedback you have shared</p>
        </div>
        <button className="new-feedback-btn" onClick={openModal}>
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
        {isLoading && (
          <div className="feedback-loading">
            <Loader2 size={24} className="spin" />
            Loading feedback...
          </div>
        )}

        {!isLoading && currentList.length === 0 && (
          <div className="feedback-empty">
            No {activeTab} feedback yet.
          </div>
        )}

        {!isLoading && activeTab === 'received' && receivedFeedback.map((item) => (
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
            <div className="feedback-person-row">
              {item.fromPhoto ? (
                <img src={item.fromPhoto} alt={item.from} className="feedback-person-avatar-img" />
              ) : (
                <span className="feedback-person-avatar">{getInitials(item.from)}</span>
              )}
              <span>From: <strong>{item.from}</strong></span>
            </div>
            <p>{item.description}</p>
          </article>
        ))}

        {!isLoading && activeTab === 'given' && givenFeedback.map((item) => (
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
            <div className="feedback-person-row">
              {item.toPhoto ? (
                <img src={item.toPhoto} alt={item.to} className="feedback-person-avatar-img" />
              ) : (
                <span className="feedback-person-avatar">{getInitials(item.to)}</span>
              )}
              <span>To: <strong>{item.to}</strong></span>
            </div>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      {showNewFeedbackModal && (
        <div className="feedback-modal-backdrop" onClick={() => setShowNewFeedbackModal(false)}>
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
              <label>To</label>
              <UserSearchDropdown
                selectedUser={selectedUser}
                onSelect={setSelectedUser}
              />
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
                placeholder="Share your feedback... emojis welcome! 😊"
              />
            </div>

            {submitError && (
              <p className="feedback-error">{submitError}</p>
            )}

            <div className="feedback-form-actions">
              <button className="feedback-secondary-btn" onClick={() => setShowNewFeedbackModal(false)}>
                Cancel
              </button>
              <button
                className="feedback-primary-btn"
                onClick={handleSubmitFeedback}
                disabled={submitting || !selectedUser || !title.trim() || !description.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default FeedbackPage;
