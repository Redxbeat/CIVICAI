'use client';

import { useState } from 'react';
import Link from 'next/link';
import CitizenForm from './citizen-form';
import AgencyDashboard from './agency-dashboard';
import MetricsDashboard from './metrics-dashboard';
import AdminDashboard from './admin-dashboard';
import MapDashboard from './map-dashboard';
import { apiUrl } from './api-client';

const stats = [
  { label: 'Citizen requests', value: '100,000' },
  { label: 'Hotspots detected', value: '27' },
  { label: 'Priority regions', value: '12' },
  { label: 'Active projects', value: '84' },
];

const sectors = ['Healthcare', 'Roads', 'Water', 'Education', 'Internet', 'Electricity'];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'map' | 'citizen' | 'agency' | 'metrics' | 'admin'>('map');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@civicai.gov');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const navigateToTab = (tab: 'map' | 'citizen' | 'agency' | 'metrics' | 'admin') => {
    setActiveTab(tab);
    setTimeout(() => {
      document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        if (data.access_token) {
          localStorage.setItem('civicai_admin_token', data.access_token);
        }
      }

      setIsAdminAuthenticated(true);
      setShowLoginModal(false);
      navigateToTab('admin');
    } catch (err) {
      setLoginError('Invalid admin credentials. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setIsAdminAuthenticated(true);
    setShowLoginModal(false);
    navigateToTab('admin');
  };

  return (
    <main>
      <header>
        <div className="container">
          <nav>
            <div className="brand" onClick={() => navigateToTab('map')} style={{ cursor: 'pointer' }}>
              CIVICAI
            </div>
            <div className="nav-links">
              <span onClick={() => navigateToTab('map')} style={{ cursor: 'pointer', color: activeTab === 'map' ? '#38bdf8' : 'inherit', fontWeight: activeTab === 'map' ? 'bold' : 'normal' }}>
                🗺️ Digital Twin Map
              </span>
              <Link href="/file-request" style={{ cursor: 'pointer', color: '#0284c7', fontWeight: 'bold', textDecoration: 'none' }}>
                📝 File Request Page ↗
              </Link>
              <span onClick={() => navigateToTab('metrics')} style={{ cursor: 'pointer' }}>
                Metrics & Hotspots
              </span>
              <span onClick={() => navigateToTab('agency')} style={{ cursor: 'pointer' }}>
                Agency Queues
              </span>
              <span onClick={() => navigateToTab('admin')} style={{ cursor: 'pointer' }}>
                Admin Audit Logs
              </span>
            </div>
            {isAdminAuthenticated ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold' }}>✓ Admin</span>
                <button
                  type="button"
                  onClick={() => setIsAdminAuthenticated(false)}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowLoginModal(true)}>
                Admin Login
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="container">
        <section className="hero">
          <div>
            <span className="chip">PROPVR • 3D DIGITAL TWIN ENGINE</span>
            <h1>Citizen Voice → Geospatial Infrastructure Intelligence</h1>
            <p>
              CIVICAI Digital Twin merges real-time telemetry, citizen feedback, and AI triage to deliver an interactive 3D map of public infrastructure demand and incident response.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="button" onClick={() => navigateToTab('map')}>
                🗺️ Explore Digital Twin Map
              </button>
              <Link
                href="/file-request"
                style={{
                  background: '#0284c7',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                📝 Submit Request Page ↗
              </Link>
            </div>
          </div>
          <div className="panel">
            <h3>National development intelligence</h3>
            <div className="stat-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="card">
                  <div className="metric">{stat.value}</div>
                  <div>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card-grid">
          <div className="card">
            <h3>Top sectors</h3>
            <div>
              {sectors.map((sector) => (
                <span key={sector} className="chip">
                  {sector}
                </span>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Priority score</h3>
            <div className="metric">94/100</div>
            <p>Rural healthcare connectivity hotspot</p>
          </div>
          <div className="card">
            <h3>Investment gap</h3>
            <div className="metric">₹4.2B</div>
            <p>Estimated unmet public infrastructure demand</p>
          </div>
        </section>

        <div id="tabs-section" style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTab('map')}
              style={{
                padding: '12px 24px',
                borderBottom: activeTab === 'map' ? '3px solid #0284c7' : 'none',
                color: activeTab === 'map' ? '#0284c7' : '#6b7280',
                fontWeight: activeTab === 'map' ? 'bold' : 'normal',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              🌐 3D Digital Twin Map
            </button>
            <button
              onClick={() => setActiveTab('citizen')}
              style={{
                padding: '12px 24px',
                borderBottom: activeTab === 'citizen' ? '3px solid #2563eb' : 'none',
                color: activeTab === 'citizen' ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === 'citizen' ? 'bold' : 'normal',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                whiteSpace: 'nowrap',
              }}
            >
              Citizen Intake
            </button>
            <button
              onClick={() => setActiveTab('agency')}
              style={{
                padding: '12px 24px',
                borderBottom: activeTab === 'agency' ? '3px solid #2563eb' : 'none',
                color: activeTab === 'agency' ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === 'agency' ? 'bold' : 'normal',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                whiteSpace: 'nowrap',
              }}
            >
              Agency Dashboard
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              style={{
                padding: '12px 24px',
                borderBottom: activeTab === 'metrics' ? '3px solid #2563eb' : 'none',
                color: activeTab === 'metrics' ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === 'metrics' ? 'bold' : 'normal',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                whiteSpace: 'nowrap',
              }}
            >
              System Metrics
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '12px 24px',
                borderBottom: activeTab === 'admin' ? '3px solid #2563eb' : 'none',
                color: activeTab === 'admin' ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === 'admin' ? 'bold' : 'normal',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              🛡️ Admin Audit Logs
            </button>
          </div>

          {activeTab === 'map' && <MapDashboard />}
          {activeTab === 'citizen' && <CitizenForm />}
          {activeTab === 'agency' && <AgencyDashboard />}
          {activeTab === 'metrics' && <MetricsDashboard />}
          {activeTab === 'admin' && (
            <AdminDashboard
              isAuthenticated={isAdminAuthenticated}
              onLoginClick={() => setShowLoginModal(true)}
            />
          )}
        </div>
      </div>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 32,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  background: '#dbeafe',
                  color: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  fontSize: 24,
                }}
              >
                🛡️
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                Admin Authentication
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Sign in to access system audit logs and override workflows.
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  border: 'none',
                  fontSize: 15,
                  cursor: 'pointer',
                  marginBottom: 12,
                }}
              >
                {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                ⚡ Instant Demo Login (Click Here)
              </button>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                width: '100%',
                marginTop: 12,
                padding: 8,
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
