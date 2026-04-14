import { useEffect, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import '../AdminCenterPage.css';

type FeedbackItem = {
  id: number;
  title: string;
  description: string;
  sender: string;
  receiver: string;
  created_at: string | null;
};

type Props = {
  onNavigate: (path: string) => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminFeedbackConfigPage({ onNavigate }: Props) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  const token = localStorage.getItem('auth_token') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    if (search.trim()) params.set('q', search.trim());

    fetch(`/api/v1/feedback/all?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configFeedback" onNavigate={onNavigate} />
        <div className="admin-center-content">
          <div className="admin-users-toolbar">
            <div>
              <h1>Configuration &gt; Feedback</h1>
              <p>View all feedback exchanged between employees.</p>
            </div>
          </div>

          <div className="admin-filters-bar">
            <Search size={14} style={{ color: 'var(--gray-400)' }} />
            <input
              className="admin-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title or description..."
            />
          </div>

          {loading ? (
            <div className="admin-loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="admin-empty-state">
              <MessageSquare size={32} />
              <h3>No feedback found</h3>
              <p>Feedback sent between employees will appear here.</p>
            </div>
          ) : (
            <>
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '20%' }}>Title</th>
                      <th style={{ width: '30%' }}>Description</th>
                      <th style={{ width: '15%' }}>Sender</th>
                      <th style={{ width: '15%' }}>Receiver</th>
                      <th style={{ width: '15%' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{startIdx + idx}</td>
                        <td>{item.title}</td>
                        <td className="admin-feedback-desc-cell">{item.description}</td>
                        <td>{item.sender || '—'}</td>
                        <td>{item.receiver || '—'}</td>
                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <p>Showing {startIdx}-{endIdx} of {total}</p>
                <div className="admin-pagination-controls">
                  <button
                    className="admin-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 13 }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="admin-pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
