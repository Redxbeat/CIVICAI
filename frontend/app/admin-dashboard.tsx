'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from './api-client';

interface AuditLog {
  id: string;
  request_id: string;
  event_type: string;
  action: string;
  details: string;
  agency: string;
  actor: string;
  timestamp: string;
  status: string;
  severity_band: string;
}

interface RequestItem {
  request_id: string;
  category: string;
  location: string;
  urgency: number;
  severity_band: string;
  routed_agency: string;
  status: string;
  assigned_to?: string;
  original_text: string;
}

interface AdminDashboardProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

export default function AdminDashboard({ isAuthenticated, onLoginClick }: AdminDashboardProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filterAgency, setFilterAgency] = useState<string>('ALL');
  const [filterEventType, setFilterEventType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action modal state
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('triaged');
  const [staffOfficer, setStaffOfficer] = useState<string>('Officer K. Sharma');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filterAgency, filterEventType]);

  async function fetchAdminData() {
    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      let logsUrl = apiUrl('/dashboard/audit-logs');
      const params = new URLSearchParams();
      if (filterAgency !== 'ALL') params.append('agency', filterAgency);
      if (filterEventType !== 'ALL') params.append('event_type', filterEventType);
      if (params.toString()) logsUrl += `?${params.toString()}`;

      const [logsRes, queueRes] = await Promise.all([
        fetch(logsUrl),
        fetch(apiUrl('/dashboard/triage-queue')),
      ]);

      if (!logsRes.ok || !queueRes.ok) {
        throw new Error('Failed to fetch admin audit data');
      }

      const logsData = await logsRes.json();
      const queueData = await queueRes.json();

      setLogs(logsData.logs || []);
      setRequests(queueData.queue || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading admin data');
      console.error('Admin Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(requestId: string, statusToSet: string) {
    try {
      const res = await fetch(apiUrl(`/dashboard/request/${encodeURIComponent(requestId)}/status?new_status=${encodeURIComponent(statusToSet)}`), {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Status transition failed');
      }
      setActionSuccess(`Successfully updated request ${requestId} status to '${statusToSet}'`);
      setSelectedRequestId(null);
      fetchAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handleAssignStaff(requestId: string, officer: string) {
    try {
      const res = await fetch(apiUrl(`/dashboard/request/${encodeURIComponent(requestId)}/assign?assigned_to=${encodeURIComponent(officer)}`), {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to assign staff officer');
      }
      setActionSuccess(`Successfully assigned ${officer} to request ${requestId}`);
      setSelectedRequestId(null);
      fetchAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign officer');
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="panel" style={{ marginTop: 24, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' }}>
        <div style={{ width: 64, height: 64, background: '#dbeafe', borderRadius: '50%', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: 28, fontWeight: 'bold' }}>
          🛡️
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>Admin Access Required</h2>
        <p style={{ color: '#64748b', maxWidth: 480, margin: '0 auto 24px auto', fontSize: 15, lineHeight: 1.6 }}>
          The System Audit & Administrative Control Panel is restricted to authorized government personnel and system administrators.
        </p>
        <button
          onClick={onLoginClick}
          style={{
            padding: '12px 28px',
            background: '#2563eb',
            color: 'white',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
          }}
        >
          Login as Admin
        </button>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="panel" style={{ marginTop: 24, textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Loading admin audit logs...</p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ marginTop: 24 }}>
      {/* Header Banner */}
      <div style={{ background: '#0f172a', color: 'white', padding: 24, borderRadius: 10, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ background: '#22c55e', width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8' }}>SYSTEM AUDIT & CONTROL</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
            Administrative Control Panel
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 0 0' }}>
            Logged in as <strong style={{ color: '#38bdf8' }}>admin@civicai.gov</strong> (Senior System Admin)
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          style={{
            padding: '8px 18px',
            background: '#334155',
            color: 'white',
            border: '1px solid #475569',
            borderRadius: 6,
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ↻ Refresh Logs
        </button>
      </div>

      {actionSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: 14, borderRadius: 8, marginBottom: 20, fontWeight: 500 }}>
          ✓ {actionSuccess}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: 14, borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Total Audit Logs</p>
          <p style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{logs.length}</p>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: 4 }}>SLA Risk Watches</p>
          <p style={{ fontSize: 28, fontWeight: 'bold', color: '#991b1b', margin: 0 }}>
            {logs.filter(l => l.event_type === 'sla_monitoring').length}
          </p>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>Officer Assignments</p>
          <p style={{ fontSize: 28, fontWeight: 'bold', color: '#166534', margin: 0 }}>
            {logs.filter(l => l.event_type === 'assignment').length}
          </p>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', marginBottom: 4 }}>Active Requests</p>
          <p style={{ fontSize: 28, fontWeight: 'bold', color: '#1e40af', margin: 0 }}>{requests.length}</p>
        </div>
      </div>

      {/* Admin Action Bar for Requests */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 32, background: '#fafafa' }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 }}>
          ⚡ Administrative Actions & Request Override
        </h3>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
          Reassign staff officers or transition workflow status across agency queues.
        </p>

        {requests.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No requests available for administrative action.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {requests.slice(0, 4).map((req) => (
              <div key={req.request_id} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13 }}>{req.request_id}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#e2e8f0', fontWeight: 'bold' }}>{req.status}</span>
                </div>
                <p style={{ fontSize: 13, color: '#334155', fontWeight: 600, margin: '0 0 4px 0' }}>{req.category} • {req.location}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px 0' }}>Agency: {req.routed_agency}</p>
                <button
                  onClick={() => setSelectedRequestId(req.request_id)}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Manage / Transition Request
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Table Section */}
      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
            Audit Event Stream ({logs.length} events)
          </h3>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="ALL">All Agencies</option>
              <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
              <option value="District Health Officer (DHO)">District Health Officer (DHO)</option>
              <option value="Water Authority">Water Authority</option>
            </select>

            <select
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="ALL">All Event Types</option>
              <option value="request_created">Request Created</option>
              <option value="assignment">Staff Assignment</option>
              <option value="sla_monitoring">SLA Monitoring</option>
            </select>
          </div>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            No audit logs found for the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 16px' }}>REQUEST ID</th>
                  <th style={{ padding: '12px 16px' }}>ACTION / EVENT</th>
                  <th style={{ padding: '12px 16px' }}>DETAILS</th>
                  <th style={{ padding: '12px 16px' }}>AGENCY</th>
                  <th style={{ padding: '12px 16px' }}>ACTOR</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {log.request_id}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          fontSize: 11,
                          background:
                            log.event_type === 'sla_monitoring'
                              ? '#fee2e2'
                              : log.event_type === 'assignment'
                              ? '#dcfce7'
                              : '#e0f2fe',
                          color:
                            log.event_type === 'sla_monitoring'
                              ? '#991b1b'
                              : log.event_type === 'assignment'
                              ? '#166534'
                              : '#0369a1',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{log.details}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{log.agency}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontStyle: 'italic' }}>{log.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedRequestId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setSelectedRequestId(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 28,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
              Manage Request {selectedRequestId}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Update workflow status or assign staff officer.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6 }}>
                Transition Status
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="triaged">triaged</option>
                  <option value="assigned">assigned</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
                <button
                  onClick={() => handleStatusUpdate(selectedRequestId, newStatus)}
                  style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Update
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6 }}>
                Assign Staff Officer
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={staffOfficer}
                  onChange={(e) => setStaffOfficer(e.target.value)}
                  placeholder="Officer Name"
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
                <button
                  onClick={() => handleAssignStaff(selectedRequestId, staffOfficer)}
                  style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Assign
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedRequestId(null)}
              style={{ width: '100%', padding: 10, background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
