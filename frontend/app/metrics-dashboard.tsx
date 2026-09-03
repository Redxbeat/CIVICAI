'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from './api-client';

interface MetricsData {
  total_requests: number;
  by_category?: Record<string, number>;
  by_status?: Record<string, number>;
  by_language?: Record<string, number>;
  critical_count?: number;
  high_count?: number;
  average_triage_score?: number;
  urgency_stats?: {
    min: number;
    max: number;
    avg: number;
  };
}

interface Hotspot {
  region: string;
  total_requests: number;
  categories?: string[];
  total_population_affected?: number;
  avg_urgency?: number;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [workload, setWorkload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, hotspotsRes, workloadRes] = await Promise.all([
        fetch(apiUrl('/dashboard/metrics')),
        fetch(apiUrl('/dashboard/geographic-hotspots')),
        fetch(apiUrl('/dashboard/agency-workload')),
      ]);

      if (!metricsRes.ok || !hotspotsRes.ok || !workloadRes.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const metricsData = await metricsRes.json();
      const hotspotsData = await hotspotsRes.json();
      const workloadData = await workloadRes.json();

      let parsedHotspots: Hotspot[] = [];
      if (Array.isArray(hotspotsData)) {
        parsedHotspots = hotspotsData;
      } else if (Array.isArray(hotspotsData.hotspots)) {
        parsedHotspots = hotspotsData.hotspots;
      } else if (hotspotsData && typeof hotspotsData === 'object') {
        parsedHotspots = Object.entries(hotspotsData).map(([region, data]: [string, any]) => ({
          region,
          total_requests: data.total_requests || 0,
          total_population_affected: data.total_population_affected || 0,
          avg_urgency: data.avg_urgency || 0,
          categories: data.categories ? Object.keys(data.categories) : [],
        }));
      }

      setMetrics(metricsData);
      setHotspots(parsedHotspots);
      setWorkload(workloadData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading metrics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="panel" style={{ marginTop: 24, textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Loading metrics...</p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#111827' }}>System Metrics Dashboard</h2>
          <button
            onClick={fetchMetrics}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}
      </div>

      {metrics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>
                Total Requests
              </p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: '#0c4a6e' }}>{metrics.total_requests}</p>
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>
                Critical
              </p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: '#7f1d1d' }}>{metrics.critical_count || 0}</p>
            </div>
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#92400e', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>
                High Priority
              </p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: '#78350f' }}>{metrics.high_count || 0}</p>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#166534', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>
                Avg Triage Score
              </p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: '#15803d' }}>
                {metrics.average_triage_score?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>By Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {metrics.by_category &&
                  Object.entries(metrics.by_category)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([category, count]) => (
                      <div key={category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 'bold', color: '#374151' }}>{category}</span>
                          <span style={{ color: '#6b7280' }}>{count}</span>
                        </div>
                        <div
                          style={{
                            background: '#e5e7eb',
                            borderRadius: 4,
                            height: 8,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              background: '#2563eb',
                              height: '100%',
                              width: `${Math.min(((count as number) / (metrics.total_requests || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>By Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {metrics.by_status &&
                  Object.entries(metrics.by_status)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([status, count]) => (
                      <div key={status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 'bold', color: '#374151', textTransform: 'capitalize' }}>{status}</span>
                          <span style={{ color: '#6b7280' }}>{count}</span>
                        </div>
                        <div
                          style={{
                            background: '#e5e7eb',
                            borderRadius: 4,
                            height: 8,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              background: '#10b981',
                              height: '100%',
                              width: `${Math.min(((count as number) / (metrics.total_requests || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>By Language</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {metrics.by_language &&
                  Object.entries(metrics.by_language)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([language, count]) => (
                      <div key={language}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 'bold', color: '#374151' }}>{language}</span>
                          <span style={{ color: '#6b7280' }}>{count}</span>
                        </div>
                        <div
                          style={{
                            background: '#e5e7eb',
                            borderRadius: 4,
                            height: 8,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              background: '#8b5cf6',
                              height: '100%',
                              width: `${Math.min(((count as number) / (metrics.total_requests || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Urgency Distribution</h3>
              {metrics.urgency_stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>MINIMUM</p>
                    <p style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                      {metrics.urgency_stats.min?.toFixed(1) || '0.0'}/10
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>AVERAGE</p>
                    <p style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                      {metrics.urgency_stats.avg?.toFixed(1) || '0.0'}/10
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>MAXIMUM</p>
                    <p style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                      {metrics.urgency_stats.max?.toFixed(1) || '0.0'}/10
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Geographic Hotspots</h3>
        {hotspots.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>No hotspots data available</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hotspots.slice(0, 10).map((spot) => (
              <div key={spot.region} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>REGION</p>
                    <p style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{spot.region}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>REQUESTS</p>
                    <p style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{spot.total_requests}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>AVG URGENCY</p>
                    <p style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                      {spot.avg_urgency?.toFixed(1) || 'N/A'}/10
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4 }}>POPULATION AFFECTED</p>
                    <p style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                      {spot.total_population_affected?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
