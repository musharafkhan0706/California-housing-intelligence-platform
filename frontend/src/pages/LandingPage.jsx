import React from 'react';
import { 
  Compass, Calculator, ArrowRight, ShieldCheck, 
  BarChart3, Cpu, MapPin, Scale, CheckCircle2, Bot 
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const highlights = [
    {
      title: "Census District Granularity",
      desc: "Comprehensive 20,640 California block groups representing historical demographics and room ratios.",
      badge: "20,640 Housing Records",
      badgeClass: "badge-purple",
      icon: MapPin,
    },
    {
      title: "Deep Neural Network Engine",
      desc: "Calibrated 4-layer sequential neural network trained on log-transformed valuations achieving 0.628 R².",
      badge: "Vectorized Inference",
      badgeClass: "badge-cyan",
      icon: Cpu,
    },
    {
      title: "Transparent Provenance",
      desc: "Zero fabricated listings. Clear separation between historical census records and model estimations.",
      badge: "Verified Trust",
      badgeClass: "badge-pink",
      icon: ShieldCheck,
    },
    {
      title: "Gemini AI Explanations",
      desc: "Grounded natural language insights explaining why certain districts command premiums.",
      badge: "AI Grounded",
      badgeClass: "badge-purple",
      icon: Bot,
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'var(--grad-hero)',
        padding: '76px 0 84px 0',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Soft background ambient gradient circles */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184, 227, 233, 0.45) 0%, rgba(245, 184, 213, 0) 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(178, 152, 231, 0.3) 0%, rgba(249, 190, 221, 0) 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', marginBottom: '20px' }}>
              <span className="badge badge-purple" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                Official California Housing Intelligence Platform
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.3rem, 5.2vw, 3.8rem)',
              lineHeight: 1.15,
              marginBottom: '22px',
              letterSpacing: '-0.03em'
            }}>
              Understand California housing with{' '}
              <span className="brand-gradient-text">data you can trust.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '36px',
              maxWidth: '720px',
              margin: '0 auto 36px auto'
            }}>
              Explore housing data, estimate property values, compare districts, and understand affordability using machine learning and transparent historical data.
            </p>

            {/* Hero CTAs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => onNavigate('explore')}
                className="brand-btn-primary"
                style={{ padding: '14px 30px', fontSize: '1.05rem', borderRadius: 'var(--radius-sm)' }}
              >
                <Compass size={20} />
                <span>Explore Housing Data</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onNavigate('estimator')}
                className="brand-btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1.05rem', borderRadius: 'var(--radius-sm)' }}
              >
                <Calculator size={20} color="var(--color-purple-dark)" />
                <span>Estimate Home Value</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              marginTop: '56px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              padding: '20px 24px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  20,640
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Housing Records
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-purple-dark)' }}>
                  0.628
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Validated Model R²
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#059669' }}>
                  $46,171
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Mean Absolute Error (MAE)
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-pink-dark)' }}>
                  &lt; 1 ms
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Vectorized Inference
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 50px auto' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>
              Scientific Decision Support
            </span>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '14px' }}>
              Built for precision, grounded in reality.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              Unlike generic portals that fabricate synthetic inventory, every data point on our platform is anchored to audited geographic data and validated machine-learning weights.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i} className="card-luxury" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--color-purple-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={24} color="var(--color-purple-dark)" />
                    </div>
                    <span className={`badge ${h.badgeClass}`}>{h.badge}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{h.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, flex: 1 }}>
                    {h.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Feature Showcase Card */}
      <section style={{ padding: '0 0 80px 0' }}>
        <div className="container">
          <div className="card-luxury" style={{
            padding: '48px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8FE 100%)',
            border: '1.5px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: '14px' }}>Decision Intelligence</span>
              <h2 style={{ fontSize: '2.1rem', marginBottom: '16px', lineHeight: 1.25 }}>
                Interactive Estimator with Full Feature Attribution
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Never settle for a black-box price tag. Our estimation tool recalculates valuations dynamically across 9 structural and demographic attributes, providing plain-language explanations of whether income, coastal proximity, or structural age drove the estimate.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span>Adjust income, structure age, rooms, and occupancy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span>Instant mortgage EMI and DTI affordability rating</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span>Ask the AI assistant for natural-language interpretation</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('estimator')}
                className="brand-btn-primary"
              >
                <span>Launch Price Estimator</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Mock Visual Demonstration Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '28px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="badge badge-cyan">Model-Generated Estimate</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lat 37.77, Lon -122.41</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Estimated Median Valuation
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '16px' }}>
                $365,400
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-purple-light)',
                marginBottom: '16px',
                fontSize: '0.82rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Median Income</div>
                  <div style={{ fontWeight: 700 }}>$52,000 / yr</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Ocean Category</div>
                  <div style={{ fontWeight: 700 }}>NEAR BAY</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Structure Age</div>
                  <div style={{ fontWeight: 700 }}>34 Years</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Estimated EMI</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-purple-dark)' }}>$2,150 / mo</div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FAFBFD',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <strong>Factor Attribution:</strong> Coastal placement in the San Francisco Bay Area and high area median income contribute +$120k over baseline.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
