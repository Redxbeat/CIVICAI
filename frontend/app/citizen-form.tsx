'use client';

import { useState } from 'react';
import { apiUrl } from './api-client';

interface TriageResult {
  request_id: string;
  language: string;
  category: string;
  urgency: number;
  triage_score: number;
  severity_band: 'critical' | 'high' | 'medium' | 'low';
  routed_agency: string;
  backup_agencies?: string[];
  escalation_level: string;
  sla_hours: number;
  escalation_priority: number;
  normalized_content: string;
  extracted_entities?: {
    locations?: string[];
    infrastructure_terms?: string[];
    urgency_keywords?: string[];
  };
}

const initialState = {
  original_text: 'Main drinking water supply pipeline burst in Kollam city with severe water flooding on main road.',
  location: 'Kollam',
};

export default function CitizenForm() {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      original_text: form.original_text,
      location: form.location,
      citizen_id: `citizen-${Date.now()}`,
    };

    try {
      const response = await fetch(apiUrl('/requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      setSubmitted(true);
      setForm(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted && result) {
    return (
      <section className="panel" style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              marginBottom: 16,
              background:
                result.severity_band === 'critical'
                  ? '#dc2626'
                  : result.severity_band === 'high'
                    ? '#ea580c'
                    : result.severity_band === 'medium'
                      ? '#ca8a04'
                      : '#16a34a',
              color: 'white',
            }}
          >
            {result.severity_band.toUpperCase()} PRIORITY
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Request Submitted Successfully
          </h2>
          <p style={{ color: '#4b5563', marginBottom: 4 }}>
            Request ID: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{result.request_id}</span>
          </p>
        </div>

        <div
          style={{
            border: '2px solid',
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
            borderColor:
              result.severity_band === 'critical'
                ? '#dc2626'
                : result.severity_band === 'high'
                  ? '#ea580c'
                  : result.severity_band === 'medium'
                    ? '#ca8a04'
                    : '#16a34a',
            background:
              result.severity_band === 'critical'
                ? 'rgba(220, 38, 38, 0.1)'
                : result.severity_band === 'high'
                  ? 'rgba(234, 88, 12, 0.1)'
                  : result.severity_band === 'medium'
                    ? 'rgba(202, 138, 4, 0.1)'
                    : 'rgba(22, 163, 74, 0.1)',
          }}
        >
          <h3 style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Triage Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.75 }}>LANGUAGE DETECTED</p>
              <p style={{ fontSize: 18, fontWeight: 'bold' }}>{result.language}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.75 }}>CATEGORY</p>
              <p style={{ fontSize: 18, fontWeight: 'bold' }}>{result.category}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.75 }}>URGENCY SCORE</p>
              <p style={{ fontSize: 18, fontWeight: 'bold' }}>{result.urgency?.toFixed(1) ?? 'N/A'}/10</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.75 }}>TRIAGE SCORE</p>
              <p style={{ fontSize: 18, fontWeight: 'bold' }}>{result.triage_score?.toFixed(2) ?? 'N/A'}</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 'bold', fontSize: 18, color: '#0c4a6e', marginBottom: 16 }}>Agency Routing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 'bold' }}>PRIMARY AGENCY</p>
              <p style={{ fontSize: 18, fontWeight: 'bold', color: '#0c4a6e' }}>{result.routed_agency}</p>
            </div>
            {result.backup_agencies && result.backup_agencies.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 'bold' }}>BACKUP AGENCIES</p>
                <ul style={{ color: '#0c4a6e', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {result.backup_agencies.map((agency, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: '#0369a1' }}>→</span> {agency}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 12, borderTop: '1px solid #93c5fd' }}>
              <div>
                <p style={{ fontSize: 11, color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Response SLA</p>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#0c4a6e' }}>{result.sla_hours}h</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Escalation Level</p>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#0c4a6e' }}>{result.escalation_level.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>

        {result.extracted_entities && (
          <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 'bold', fontSize: 18, color: '#6b21a8', marginBottom: 12 }}>Extracted Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.extracted_entities.locations && result.extracted_entities.locations.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: '#7e22ce', fontWeight: 'bold', textTransform: 'uppercase' }}>Locations</p>
                  <p style={{ color: '#6b21a8' }}>{result.extracted_entities.locations.join(', ')}</p>
                </div>
              )}
              {result.extracted_entities.infrastructure_terms && result.extracted_entities.infrastructure_terms.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: '#7e22ce', fontWeight: 'bold', textTransform: 'uppercase' }}>Infrastructure Terms</p>
                  <p style={{ color: '#6b21a8' }}>{result.extracted_entities.infrastructure_terms.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontWeight: 'bold', fontSize: 18, color: '#166534', marginBottom: 8 }}>Your Request</h3>
          <p style={{ color: '#1f2937', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
            &quot;{result.normalized_content}&quot;
          </p>
        </div>

        <div style={{ marginTop: 24, padding: 24, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>What Happens Next?</h3>
          <ul style={{ color: '#374151', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#16a34a', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
              <span>Your request has been received and automatically triaged by our AI system.</span>
            </li>
            <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#16a34a', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
              <span>
                <strong>{result.routed_agency}</strong> will respond within <strong>{result.sla_hours} hours</strong>.
              </span>
            </li>
            <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#16a34a', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
              <span>You can track your request status using your Request ID.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => {
            setSubmitted(false);
            setResult(null);
          }}
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
            fontSize: 16,
          }}
        >
          Submit Another Request
        </button>
      </section>
    );
  }

  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Report an Issue</h2>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Describe your civic infrastructure concern in your preferred language. Our AI system will automatically analyze and route your request to the appropriate government agency.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
            Your Message *
          </label>
          <textarea
            value={form.original_text}
            onChange={(e) => setForm({ ...form, original_text: e.target.value })}
            rows={5}
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            placeholder="Describe your issue in Malayalam, Hindi, English, or any local language..."
            required
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Multilingual support: Malayalam, Hindi, English, and more.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City or area name"
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <p style={{ fontWeight: 'bold' }}>Error</p>
            <p style={{ fontSize: 14 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              borderRadius: 8,
              fontWeight: 'bold',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 16,
              minWidth: 200,
            }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
        <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>How it works:</h3>
        <ol style={{ color: '#374151', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 20 }}>
          <li style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontWeight: 'bold', color: '#2563eb', flexShrink: 0 }}>1.</span>
            <span>Your request is automatically analyzed and categorized using AI.</span>
          </li>
          <li style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontWeight: 'bold', color: '#2563eb', flexShrink: 0 }}>2.</span>
            <span>The urgency and impact are assessed to determine priority.</span>
          </li>
          <li style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontWeight: 'bold', color: '#2563eb', flexShrink: 0 }}>3.</span>
            <span>Your request is routed to the appropriate government agency.</span>
          </li>
          <li style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontWeight: 'bold', color: '#2563eb', flexShrink: 0 }}>4.</span>
            <span>You receive a response within the specified time frame.</span>
          </li>
        </ol>
      </div>
    </section>
  );
}
