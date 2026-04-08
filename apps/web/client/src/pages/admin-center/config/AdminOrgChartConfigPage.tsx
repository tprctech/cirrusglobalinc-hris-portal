import { useState } from 'react';
import { Download } from 'lucide-react';
import AdminCenterSidebar from '../../../components/AdminCenterSidebar';
import '../AdminCenterPage.css';

type AdminOrgChartConfigPageProps = {
  onNavigate?: (path: string) => void;
};

function AdminOrgChartConfigPage({ onNavigate }: AdminOrgChartConfigPageProps) {
  const [exporting, setExporting] = useState(false);

  const navigate = onNavigate ?? ((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });

  async function handleExportPdf() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch('/api/v1/hr/employees/org-chart/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'organization-chart.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="admin-center-page">
      <div className="admin-center-shell">
        <AdminCenterSidebar activeMenu="configOrgChart" onNavigate={navigate} />

        <div className="admin-center-content">
          <div className="admin-users-toolbar">
            <div>
              <h1>Configuration &gt; Organization Chart</h1>
              <p>Manage admin-side settings for the Organization Chart module.</p>
            </div>
          </div>

          <section className="admin-users-section">
            <div className="admin-users-toolbar">
              <div>
                <h2>Export Organization Chart</h2>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                  Generate and download the full organization chart as a PDF document. Includes all active employees, department color codes, and reporting structure.
                </p>
              </div>
            </div>
            <div>
              <button
                className="admin-invite-btn"
                onClick={handleExportPdf}
                disabled={exporting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export as PDF'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default AdminOrgChartConfigPage;
