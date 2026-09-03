'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from './api-client';

interface QueueItem {
  request_id: string;
  category: string;
  location: string;
  urgency: number;
  severity_band: string;
  routed_agency: string;
  sla_hours: number;
  escalation_priority: number;
  triage_score: number;
  status: string;
  population_affected: number;
  original_text: string;
}

export default function AgencyDashboard() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState('Public Works Department (PWD)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<QueueItem | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgency]);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, workloadRes, queueRes] = await Promise.all([
        fetch(apiUrl('/dashboard/metrics')),
        fetch(apiUrl('/dashboard/agency-workload')),
        fetch(apiUrl(`/dashboard/triage-queue?agency=${encodeURIComponent(selectedAgency)}`)),
      ]);

      if (!metricsRes.ok || !workloadRes.ok || !queueRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const metricsData = await metricsRes.json();
      const workloadData = await workloadRes.json();
      const queueData = await queueRes.json();

      setMetrics(metricsData);
      setWorkload(workloadData);
      setQueue(queueData.queue || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getSeverityColor = (band: string) => {
    switch (band) {
      case 'critical':
        return { bg: 'rgb(220, 38, 38)', text: 'white', light: 'rgb(254, 226, 226)' };
      case 'high':
        return { bg: 'rgb(234, 88, 12)', text: 'white', light: 'rgb(254, 237, 226)' };
      case 'medium':
        return { bg: 'rgb(202, 138, 4)', text: 'white', light: 'rgb(254, 252, 232)' };
      case 'low':
        return { bg: 'rgb(22, 163, 74)', text: 'white', light: 'rgb(240, 253, 244)' };
      default:
        return { bg: 'rgb(107, 114, 128)', text: 'white', light: 'rgb(249, 250, 251)' };
    }
  };

  const getAgencies = () => [
    'Public Works Department (PWD)',
    'District Health Officer (DHO)',
    'Water Authority',
    'Electricity Board',
    'Municipal Engineering',
  ];

  if (loading) {
    return (
      <section className="panel" style={{ marginTop: 24, textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          Government Agency Dashboard
        </h2>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 }}>
            Select Agency
          </label>
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              width: '100%',
              maxWidth: 400,
              fontFamily: 'inherit',
            }}
          >
            {getAgencies().map((agency) => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
          </select>
        </div>

        {metrics && workload && workload[selectedAgency] && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 'bold', marginBottom: 8 }}>QUEUE SIZE</p>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#0c4a6e' }}>
                {workload[selectedAgency].total_queue}
              </p>
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 'bold', marginBottom: 8 }}>CRITICAL</p>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#7f1d1d' }}>
                {workload[selectedAgency].critical}
              </p>
            </div>
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#92400e', fontWeight: 'bold', marginBottom: 8 }}>HIGH</p>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#78350f' }}>
                {workload[selectedAgency].high}
              </p>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#166534', fontWeight: 'bold', marginBottom: 8 }}>AVG SLA (hrs)</p>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#15803d' }}>
                {workload[selectedAgency].avg_sla_hours}
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          Triage Queue ({queue.length} requests)
        </h3>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <p style={{ fontSize: 16 }}>No requests in queue for this agency.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {queue.map((request) => {
              const color = getSeverityColor(request.severity_band);
              return (
                <div
                  key={request.request_id}
                  onClick={() => setSelectedRequest(request)}
                  style={{
                    border: '2px solid',
                    borderColor: color.bg,
                    borderRadius: 8,
                    padding: 16,
                    background: color.light,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 'bold', opacity: 0.75 }}>REQUEST ID</p>
                      <p style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' }}>{request.request_id}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 'bold', opacity: 0.75 }}>CATEGORY</p>
                      <p style={{ fontSize: 14, fontWeight: 'bold' }}>{request.category}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 'bold', opacity: 0.75 }}>LOCATION</p>
                      <p style={{ fontSize: 14, fontWeight: 'bold' }}>{request.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: color.bg,
                          color: color.text,
                          borderRadius: 6,
                          fontWeight: 'bold',
                          fontSize: 12,
                        }}
                      >
                        {request.severity_band?.toUpperCase() ?? 'MEDIUM'}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      gap: 16,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${color.bg}`,
                      opacity: 0.85,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Urgency</p>
                      <p style={{ fontSize: 13, fontWeight: 'bold' }}>{request.urgency?.toFixed(1) ?? 'N/A'}/10</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>SLA</p>
                      <p style={{ fontSize: 13, fontWeight: 'bold' }}>{request.sla_hours}h</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Population</p>
                      <p style={{ fontSize: 13, fontWeight: 'bold' }}>{request.population_affected?.toLocaleString() ?? '0'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Triage Score</p>
                      <p style={{ fontSize: 13, fontWeight: 'bold' }}>{request.triage_score?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedRequest && (
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
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 32,
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>
              Request Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>REQUEST ID</p>
                <p style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {selectedRequest.request_id}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>ORIGINAL CONTENT</p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>
                  &quot;{selectedRequest.original_text}&quot;
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>CATEGORY</p>
                  <p style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedRequest.category}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>LOCATION</p>
                  <p style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedRequest.location}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>URGENCY</p>
                  <p style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedRequest.urgency?.toFixed(1) ?? 'N/A'}/10</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>TRIAGE SCORE</p>
                  <p style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedRequest.triage_score?.toFixed(2) ?? 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>SLA (hours)</p>
                  <p style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedRequest.sla_hours}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>POPULATION AFFECTED</p>
                  <p style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedRequest.population_affected?.toLocaleString() ?? '0'}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              style={{
                width: '100%',
                marginTop: 24,
                padding: 12,
                background: '#2563eb',
                color: 'white',
                borderRadius: 8,
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
