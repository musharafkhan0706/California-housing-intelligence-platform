import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Cpu, Bot, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../api';

export default function TrustPage() {
  const [trustInfo, setTrustInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustData();
  }, []);

  async function loadTrustData() {
    setLoading(true);
    try {
      const data = await api.trust.getInfo();
      setTrustInfo(data);
    } catch (err) {
      console.error("Trust info error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Page Header */}
      <div style={{ maxWidth: '800px', marginBottom: '36px' }}>
        <span className="badge badge-purple" style={{ marginBottom: '8px' }}>
          Trust, Transparency & Provenance
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          Data & Model Methodology
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6 }}>
          We believe housing intelligence should be transparent, verifiable, and grounded in real historical data. Review our audited dataset provenance, machine-learning regression metrics, and AI grounding policies.
        </p>
      </div>

      {/* 3 Core Trust Pillars Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* Pillar 1: Data Provenance */}
        <div className="card-luxury" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--color-cyan-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={20} color="var(--color-cyan-dark)" />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Dataset Provenance</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '16px' }}>
            {trustInfo?.data_provenance?.integrity_disclosure || "Historical census block groups from the 1990 U.S. Census."}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Historical Housing Records</span>
              <strong>{trustInfo?.data_provenance?.record_count?.toLocaleString() || "20,640"}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Spatial Coverage</span>
              <strong>Statewide California</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Granularity</span>
              <strong>Census Block Groups</strong>
            </div>
          </div>
        </div>

        {/* Pillar 2: Machine Learning Architecture */}
        <div className="card-luxury" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--color-purple-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={20} color="var(--color-purple-dark)" />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Neural Net Pipeline</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '16px' }}>
            4-layer sequential deep neural network with dropout regularization, trained on natural log transformations ln(1 + value) to stabilize high-value variance.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Model Tag</span>
              <strong style={{ color: 'var(--color-purple-dark)' }}>{trustInfo?.ml_pipeline?.model_version || "housing_model_v1.0"}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Coefficient of Determination (R²)</span>
              <strong style={{ color: '#059669' }}>{trustInfo?.ml_pipeline?.validation_metrics?.r2_score || "0.6276"}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mean Absolute Error (MAE)</span>
              <strong>${trustInfo?.ml_pipeline?.validation_metrics?.mae?.toLocaleString() || "46,171"}</strong>
            </div>
          </div>
        </div>

        {/* Pillar 3: AI Grounding Policy */}
        <div className="card-luxury" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--color-pink-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} color="var(--color-pink-dark)" />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>AI Explanation & Grounding</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '16px' }}>
            {trustInfo?.ai_integration?.guardrails || "Strict grounding policy ensuring no fabricated properties, prices, or advice."}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle2 size={16} /> Zero Fabricated MLS Listings
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle2 size={16} /> Zero Fabricated Street Addresses
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle2 size={16} /> Strict "I don't have verified data" Fallback
            </div>
          </div>
        </div>
      </div>

      {/* Feature Engineering & Transformation Table */}
      <div className="card-luxury" style={{ padding: '32px', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>
          Model Input Vector & Preprocessing Pipeline
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          The machine-learning pipeline extracts and standardizes 9 core features. Inference uses the exact mathematical transformations established during training:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>
          {[
            { name: "longitude", type: "Continuous Float", desc: "State geographic longitude (StandardScaler normalized)" },
            { name: "latitude", type: "Continuous Float", desc: "State geographic latitude (StandardScaler normalized)" },
            { name: "housing_median_age", type: "Continuous Float", desc: "Median age of residential structures in district" },
            { name: "total_rooms", type: "Continuous Float", desc: "Total aggregate room count in district block group" },
            { name: "total_bedrooms", type: "Continuous Float", desc: "Total aggregate bedroom count in district" },
            { name: "population", type: "Continuous Float", desc: "District resident headcount" },
            { name: "households", type: "Continuous Float", desc: "Count of occupied housing units" },
            { name: "median_income", type: "Continuous Float", desc: "Area median income (in $10k USD units)" },
            { name: "ocean_proximity", type: "Categorical (5)", desc: "OneHotEncoder(drop='first') category: <1H OCEAN, INLAND, ISLAND, NEAR BAY, NEAR OCEAN" },
          ].map((feat, i) => (
            <div key={i} style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FAFBFD',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--color-purple-dark)' }}>{feat.name}</strong>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>{feat.type}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{feat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal & Regulatory Disclaimers (Phase 21 & 22) */}
      <div className="card-luxury" style={{
        padding: '32px',
        backgroundColor: '#FAF8FE',
        border: '1.5px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <AlertTriangle size={22} color="var(--color-purple-dark)" />
          <h3 style={{ fontSize: '1.25rem' }}>Full Legal, Financial & Appraisal Disclaimer</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {trustInfo?.legal_and_safety_disclaimer || (
            "The California Housing Intelligence Platform provides statistical estimates, geographic insights, and educational decision-support tools. All valuations are machine-learning statistical models derived from historical census block groups. Nothing on this platform constitutes formal real-estate appraisals, mortgage loan approvals, financial, legal, or investment advice. Users should consult licensed real estate appraisers and certified financial advisors before entering any binding financial transaction."
          )}
        </p>
      </div>
    </div>
  );
}
