'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '../api-client';

interface TriageResult {
  id?: number;
  request_id: string;
  language: string;
  original_text: string;
  translated_text: string;
  category: string;
  subcategory: string;
  location: string;
  urgency: number;
  triage_score: number;
  severity_band: 'critical' | 'high' | 'medium' | 'low';
  routed_agency: string;
  backup_agencies?: string[];
  action_steps?: string[];
  escalation_level: string;
  sla_hours: number;
  escalation_priority: number;
  population_affected?: number;
  normalized_content: string;
  extracted_entities?: {
    locations?: string[];
    infrastructure_terms?: string[];
    urgency_keywords?: string[];
  };
}

const presets = [
  {
    label: '📍 Kollam Pipe Burst',
    text: 'Main drinking water supply pipeline burst in Kollam city with severe water flooding on main road causing property damage.',
    location: 'Kollam',
  },
  {
    label: '⚡ Thrissur Power Outage',
    text: 'Substation transformer unit sparking near Thrissur commercial district causing total power blackout in Ward 14.',
    location: 'Thrissur',
  },
  {
    label: '🛣️ Kochi Hospital Route',
    text: 'Severe asphalt road collapse near Kochi medical hospital route blocking emergency ambulance transit.',
    location: 'Kochi',
  },
  {
    label: '🏥 Trivandrum Trauma Corridor',
    text: 'Ambulance transit blocked near Trivandrum medical college emergency trauma access corridor.',
    location: 'Trivandrum',
  },
];

export default function FileRequestPage() {
  const router = useRouter();
  const [originalText, setOriginalText] = useState(presets[0].text);
  const [location, setLocation] = useState(presets[0].location);
  const [populationAffected, setPopulationAffected] = useState<number>(3500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<TriageResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      original_text: originalText,
      location: location.trim() || undefined,
      population_affected: populationAffected,
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
      setSubmittedResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to backend server. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  // If request has been submitted, show the dedicated Triage & Status Confirmation page
  if (submittedResult) {
    const isCritical = submittedResult.severity_band === 'critical' || submittedResult.urgency >= 8.5;
    const isHigh = submittedResult.severity_band === 'high' || (submittedResult.urgency >= 7 && submittedResult.urgency < 8.5);

    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Header */}
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, padding: '16px 24px', zIndex: 10 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back to Digital Twin Overview
            </Link>
            <div style={{ background: '#0284c7', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>
              CIVICAI GEMINI 3.6 FLASH • TRIAGED
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
          {/* Severity Banner */}
          <div
            style={{
              borderRadius: 14,
              padding: '24px 32px',
              marginBottom: 32,
              background: isCritical ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' : isHigh ? 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800, opacity: 0.9 }}>
                  AI TRIAGE COMPLETED • {submittedResult.severity_band?.toUpperCase() || 'MEDIUM'} PRIORITY
                </span>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: '4px 0 8px 0', letterSpacing: '-0.02em' }}>
                  Request Logged: {submittedResult.request_id}
                </h1>
                <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
                  Automated routing completed via Google Gemini 3.6 Flash Engine
                </p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderRadius: 10, textAlign: 'center' }}>
                <span style={{ fontSize: 10, display: 'block', textTransform: 'uppercase', opacity: 0.8 }}>Target SLA</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>{submittedResult.sla_hours} Hours</span>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* Classification Card */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', marginBottom: 16 }}>
                🤖 Gemini AI Intake Analysis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Verified Location</span>
                  <p style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0 0', color: '#38bdf8' }}>📍 {submittedResult.location}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Detected Language</span>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: '2px 0 0 0' }}>{submittedResult.language}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>English Text</span>
                  <p style={{ fontSize: 13, color: '#cbd5e1', margin: '2px 0 0 0', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6 }}>
                    &quot;{submittedResult.translated_text || submittedResult.original_text}&quot;
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Category</span>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f8fafc' }}>{submittedResult.category}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Urgency Score</span>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f59e0b' }}>{submittedResult.urgency?.toFixed(1)} / 10</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Routing & SLA Card */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.05em', marginBottom: 16 }}>
                🏛️ Assigned Government Agency
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Primary Assigned Agency</span>
                  <p style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0 0', color: '#34d399' }}>{submittedResult.routed_agency}</p>
                </div>
                {submittedResult.backup_agencies && submittedResult.backup_agencies.length > 0 && (
                  <div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Support & Backup Departments</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {submittedResult.backup_agencies.map((agency, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>
                          {agency}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Impacted Population</span>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>~{submittedResult.population_affected?.toLocaleString()} Residents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Resolution SOP Action Steps */}
          {submittedResult.action_steps && submittedResult.action_steps.length > 0 && (
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', marginBottom: 16 }}>
                📋 Municipal Resolution Action Plan (Gemini SOP)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {submittedResult.action_steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '14px 28px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 'bold',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              🗺️ Track on 3D Digital Twin Map
            </button>
            <button
              onClick={() => setSubmittedResult(null)}
              style={{
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10,
                fontWeight: 'bold',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              📝 File Another Issue
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Bar */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Overview
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>AI ENGINE:</span>
            <span style={{ background: '#0284c7', color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
              GOOGLE GEMINI 3.6 FLASH
            </span>
          </div>
        </div>
      </header>

      {/* Main Request Form */}
      <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CIVICAI INTAKE WIZARD
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '12px 0 8px 0', letterSpacing: '-0.02em' }}>
            Report an Infrastructure Issue
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 560, margin: '0 auto' }}>
            Submit your civic concern in English (or any regional Indian language). Google Gemini AI automatically triages, geocodes, and routes your request.
          </p>
        </div>

        {/* Quick Demo Presets */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Quick Demo Complaint Presets (Click to Load)
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOriginalText(p.text);
                  setLocation(p.location);
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 16, padding: 32, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: 14, borderRadius: 10, fontSize: 13, marginBottom: 20 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
              Describe your infrastructure issue *
            </label>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              rows={6}
              placeholder="Describe your civic issue in English (or any regional language)..."
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
              required
            />
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 6, display: 'block' }}>
              Primary Language: English (Multilingual inputs automatically translated by Gemini AI).
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                Location / City / Area Name (e.g. Kollam, Thrissur, Mumbai)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kollam, Thrissur, Trivandrum, Bengaluru"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                Estimated Affected Population
              </label>
              <input
                type="number"
                value={populationAffected}
                onChange={(e) => setPopulationAffected(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              background: loading ? '#64748b' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 16,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '🤖 Gemini AI Triaging Request...' : '🚀 Submit Civic Request'}
          </button>
        </form>
      </main>
    </div>
  );
}
