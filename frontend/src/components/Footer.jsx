import React from 'react';
import { Home, ShieldCheck, Database, Cpu, Lock } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--border-color)',
      padding: '48px 0 32px 0',
      marginTop: '60px',
      color: 'var(--text-secondary)',
      fontSize: '0.88rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px',
          marginBottom: '40px'
        }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--grad-purple-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Home size={18} color="#17152B" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                California Housing
              </span>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Empowering home searchers, urban analysts, and researchers with transparent machine-learning price intelligence and census demographics.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-purple">ML Model v1.0</span>
              <span className="badge badge-cyan">20,640 Housing Records</span>
            </div>
          </div>

          {/* Platform Exploration */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Platform Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><button onClick={() => onNavigate('explore')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Explore California Housing</button></li>
              <li><button onClick={() => onNavigate('estimator')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Machine Learning Price Estimator</button></li>
              <li><button onClick={() => onNavigate('market')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Market Insights & Analytics</button></li>
              <li><button onClick={() => onNavigate('affordability')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Affordability & EMI Planner</button></li>
              <li><button onClick={() => onNavigate('compare')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Side-by-Side Housing Record Compare</button></li>
            </ul>
          </div>

          {/* Transparency & Governance */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Transparency & Ethics
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><button onClick={() => onNavigate('trust')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Data Provenance & Source</button></li>
              <li><button onClick={() => onNavigate('trust')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Model Evaluation & R² Metrics</button></li>
              <li><button onClick={() => onNavigate('trust')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>AI Explanation & Grounding</button></li>
              <li><button onClick={() => onNavigate('trust')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Limitations & Legal Disclaimers</button></li>
            </ul>
          </div>

          {/* Architecture Trust Badges */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Engineering Pillars
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} color="var(--color-purple-dark)" />
                <span style={{ fontSize: '0.84rem' }}>Vectorized Deep Neural Network (&lt;1ms)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={18} color="var(--color-cyan-dark)" />
                <span style={{ fontSize: '0.84rem' }}>20,640 Indexed California Records</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} color="var(--color-pink-dark)" />
                <span style={{ fontSize: '0.84rem' }}>Bcrypt Hashed & JWT Secured</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} color="#059669" />
                <span style={{ fontSize: '0.84rem' }}>Historical Data — No Fabricated Listings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Notice */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.78rem'
        }}>
          <p>
            © {new Date().getFullYear()} California Housing Intelligence Platform. Built for educational, decision-support, and computational intelligence workflows.
          </p>
          <p style={{ maxWidth: '900px', lineHeight: 1.5 }}>
            <strong>Important Regulatory Notice:</strong> This application generates statistical regression models and natural language interpretations from the California Housing Census dataset. It is not an appraisal, financial loan approval, or binding valuation tool. Consult certified real estate appraisers and licensed mortgage professionals for real-world real estate transactions.
          </p>
        </div>
      </div>
    </footer>
  );
}
