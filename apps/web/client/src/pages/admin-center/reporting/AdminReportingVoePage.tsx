import { useEffect, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import '../AdminCenterPage.css';
import './AdminReporting.css';

type VoeItem = {
  id: number;
  submitted_by: string;
  department: string;
  message: string;
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

export default function AdminReportingVoePage({ onNavigate }: Props) {
  const [items, setItems] = useState<VoeItem[]>([]);
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

    fetch(`/api/v1/voe/list?${params.toString()}`, {
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
        <AdminCenterSidebar activeMenu="reportingVoe" onNavigate={onNavigate} />
        <div className="admin-center-content">
          <div className="admin-users-toolbar">
            <div>
              <h1>Voice of Employee</h1>
              <p>View employee feedback submissions from the portal home page.</p>
            </div>
          </div>

          <div className="admin-users-filters">
            <div className="voe-search-wrap">
              <Search size={14} className="voe-search-icon" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search feedback..."
                className="admin-users-search"
              />
            </div>
          </div>

          {loading ? (
            <div className="admin-users-loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="admin-users-empty">
              <MessageSquare size={32} />
              <p>No feedback submitted yet.</p>
            </div>
          ) : (
            <>
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '18%' }}>Submitted By</th>
                    <th style={{ width: '15%' }}>Department</th>
                    <th style={{ width: '42%' }}>Message</th>
                    <th style={{ width: '20%' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{startIdx + idx}</td>
                      <td>{item.submitted_by}</td>
                      <td>{item.department || '—'}</td>
                      <td className="voe-message-cell">{item.message}</td>
                      <td>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
