import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Heart, Scale, MapPin, Send, 
  ShieldCheck, Home, Eye, Bot 
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../api';

export default function DetailsPage({ 
  districtId, 
  onBack, 
  onSelectDistrict,
  onToggleFavorite, 
  favoriteIds = [],
  onToggleCompare, 
  comparedIds = [] 
}) {
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Chat state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversation, setAiConversation] = useState([]);

  const fetchDetail = useCallback(async () => {
    if (!districtId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.housing.getDetail(districtId);
      setDistrict(data);
      setAiConversation([
        {
          role: 'assistant',
          text: `Welcome! I can provide analytical explanations about ${data.district_code} in the ${data.region_name}. What would you like to explore about this district's valuation or characteristics?`,
          source: 'Platform Intelligence'
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load district record details.');
    } finally {
      setLoading(false);
    }
  }, [districtId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleAskAi(customPrompt = null) {
    const questionToSend = customPrompt || aiQuestion;
    if (!questionToSend.trim() || !district) return;

    const userMessage = { role: 'user', text: questionToSend };
    setAiConversation((prev) => [...prev, userMessage]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const context = {
        district_code: district.district_code,
        region_name: district.region_name,
        county_name: district.county_name,
        estimated_value: district.estimated_value,
        median_income: district.median_income,
        housing_median_age: district.housing_median_age,
        ocean_proximity: district.ocean_proximity,
        latitude: district.latitude,
        longitude: district.longitude,
      };

      const res = await api.ai.ask(questionToSend, context);
      setAiConversation((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, source: res.source }
      ]);
    } catch (err) {
      setAiConversation((prev) => [
        ...prev,
        { role: 'assistant', text: "Unable to reach the AI Assistant at this time. Please try again.", source: 'Error' }
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading district intelligence...</div>
      </div>
    );
  }

  if (error || !district) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ color: '#B91C1C', marginBottom: '16px' }}>{error || 'District not found.'}</div>
        <button onClick={onBack} className="brand-btn-secondary">
          <ArrowLeft size={16} /> Return to Discovery
        </button>
      </div>
    );
  }

  const isFavorite = favoriteIds.includes(district.id);
  const isCompared = comparedIds.includes(district.id);

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button onClick={onBack} className="brand-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.86rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Housing Explorer</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onToggleFavorite(district.id)}
            className="brand-btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.86rem',
              color: isFavorite ? 'var(--color-pink-dark)' : 'inherit',
              borderColor: isFavorite ? 'var(--color-pink)' : 'var(--border-color)'
            }}
          >
            <Heart size={16} fill={isFavorite ? 'var(--color-pink-dark)' : 'none'} />
            <span>{isFavorite ? 'Saved to Favorites' : 'Save District'}</span>
          </button>

          <button
            onClick={() => onToggleCompare(district.id)}
            className="brand-btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.86rem',
              color: isCompared ? 'var(--color-purple-dark)' : 'inherit',
              borderColor: isCompared ? 'var(--color-purple)' : 'var(--border-color)'
            }}
          >
            <Scale size={16} />
            <span>{isCompared ? 'In Comparison' : 'Compare District'}</span>
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="card-luxury" style={{
        padding: '36px',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8FE 100%)',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
                District ID: {district.district_code}
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.8rem' }}>
                Model/Data Estimate
              </span>
              <span className="badge badge-pink" style={{ fontSize: '0.8rem' }}>
                {district.ocean_proximity}
              </span>
            </div>

            <h1 style={{ fontSize: '2.4rem', marginBottom: '6px' }}>
              {district.region_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <MapPin size={16} color="var(--color-purple-dark)" />
              <span>{district.county_name} • Lat: {district.latitude.toFixed(4)}, Lon: {district.longitude.toFixed(4)}</span>
            </div>
          </div>

          {/* Large Hero Metric */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px 28px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Model-Estimated Median Housing Value
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              ${district.estimated_value?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Historical Census Value: ${district.median_house_value?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 4 Key Metric Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '24px'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Median Household Income</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              ${(district.median_income * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })} / yr
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Structure Median Age</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {district.housing_median_age} Years
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Rooms / Unit</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {district.avg_rooms_per_household} Rooms
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Occupancy</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {district.avg_occupancy} People / Unit
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Characteristics + Map (Left), Explainability + AI (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '28px',
        alignItems: 'start',
        marginBottom: '40px'
      }}>
        {/* LEFT COLUMN: CHARACTERISTICS & MAP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Housing Characteristics Table */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} color="var(--color-purple-dark)" />
              <span>Census Record Characteristics</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total District Headcount (Population)</span>
                <strong>{district.population?.toLocaleString()} residents</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Occupied Households</span>
                <strong>{district.households?.toLocaleString()} units</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aggregate District Rooms</span>
                <strong>{district.total_rooms?.toLocaleString()} rooms</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aggregate District Bedrooms</span>
                <strong>{district.total_bedrooms ? district.total_bedrooms.toLocaleString() : 'N/A'} bedrooms</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bedroom to Room Ratio</span>
                <strong>{district.avg_bedrooms_per_room ? `${(district.avg_bedrooms_per_room * 100).toFixed(1)}%` : 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coastal Classification</span>
                <span className="badge badge-purple">{district.ocean_proximity}</span>
              </div>
            </div>
          </div>

          {/* Interactive Geographic Map View */}
          <div className="card-luxury" style={{ overflow: 'hidden', height: '320px', position: 'relative' }}>
            <MapContainer
              center={[district.latitude, district.longitude]}
              zoom={10}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[district.latitude, district.longitude]}
                radius={9}
                pathOptions={{
                  color: '#6C4EB8',
                  fillColor: '#B298E7',
                  fillOpacity: 0.9,
                  weight: 2
                }}
              >
                <Popup>
                  <strong>{district.district_code}</strong><br />
                  Est. Val: ${district.estimated_value?.toLocaleString()}
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: FACTOR EXPLANATIONS & GEMINI AI ASSISTANT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Factor Attribution Influences */}
          {district.factors && district.factors.influences && (
            <div className="card-luxury" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>
                <span>Why did the model estimate this value?</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                The deep neural network evaluates features against statewide California baselines:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {district.factors.influences.map((inf, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: inf.impact === 'positive' ? 'var(--color-purple-light)' : '#FAFBFD',
                      border: `1px solid ${inf.impact === 'positive' ? 'rgba(178, 152, 231, 0.4)' : 'var(--border-subtle)'}`,
                      fontSize: '0.86rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{inf.factor}</strong>
                      <span className={`badge ${inf.impact === 'positive' ? 'badge-purple' : 'badge-neutral'}`}>
                        {inf.strength} impact
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{inf.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive AI Assistant (Google Gemini) */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.1rem' }}>
                <Bot size={20} color="var(--color-purple-dark)" />
                <span>Ask Housing Assistant</span>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                Grounded ML Analysis
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Have questions about this record's valuation or affordability? Ask the assistant below:
            </p>

            {/* Quick suggested prompt buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => handleAskAi("Why is this valuation higher or lower than the California average?")}
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--color-purple-light)',
                  color: 'var(--color-purple-dark)',
                  cursor: 'pointer'
                }}
              >
                Why is it priced at this level?
              </button>
              <button
                type="button"
                onClick={() => handleAskAi("How does coastal proximity influence this district?")}
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--color-cyan-light)',
                  color: 'var(--color-cyan-dark)',
                  cursor: 'pointer'
                }}
              >
                Coastal proximity impact?
              </button>
            </div>

            {/* Conversation Window */}
            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px',
              backgroundColor: '#FAFBFD',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              {aiConversation.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: msg.role === 'user' ? 'var(--color-purple)' : '#FFFFFF',
                    color: msg.role === 'user' ? '#17152B' : 'var(--text-primary)',
                    fontSize: '0.86rem',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <p style={{ lineHeight: 1.45 }}>{msg.text}</p>
                  {msg.source && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                      {msg.source}
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Gemini is analyzing district variables...
                </div>
              )}
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ask about this district..."
                className="form-input"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAskAi(); }}
              />
              <button
                onClick={() => handleAskAi()}
                disabled={aiLoading || !aiQuestion.trim()}
                className="brand-btn-primary"
                style={{ padding: '8px 14px' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparable Dataset Records */}
      {district.comparables && district.comparables.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>
            Comparable Districts in {district.region_name}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '18px'
          }}>
            {district.comparables.map((comp) => (
              <div key={comp.id} className="card-luxury" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--color-purple-dark)', fontSize: '0.9rem' }}>{comp.district_code}</strong>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{comp.ocean_proximity}</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>
                  ${comp.estimated_value?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Income: ${(comp.median_income * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })} • Age: {comp.housing_median_age} yrs
                </div>
                <button
                  onClick={() => onSelectDistrict(comp.id)}
                  className="brand-btn-secondary"
                  style={{ width: '100%', padding: '6px', fontSize: '0.78rem' }}
                >
                  <Eye size={13} /> View Comparable
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transparency & Limitations Section (Phase 2 & 10) */}
      <div className="card-luxury" style={{
        padding: '24px',
        backgroundColor: '#FAF8FE',
        border: '1px solid var(--border-color)',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          <ShieldCheck size={18} color="var(--color-purple-dark)" />
          <span>Data Provenance & Decision-Support Scope</span>
        </div>
        <p style={{ lineHeight: 1.6 }}>
          <strong>Data Source:</strong> {district.data_source}. Figures represent historical census district averages aggregated across ~1,425 residents per block group. Valuations are statistical predictions generated by a trained deep neural network model. This platform does not provide legal, appraisal, or financial lending commitments.
        </p>
      </div>
    </div>
  );
}
