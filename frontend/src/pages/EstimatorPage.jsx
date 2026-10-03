import React, { useState } from 'react';
import { 
  Calculator, RotateCcw, Send, Bot, AlertCircle 
} from 'lucide-react';
import { api } from '../api';

const PRESETS = {
  sf_bay: {
    label: "San Francisco Bay District",
    lat: 37.7749,
    lon: -122.4194,
    income: 7.5,
    age: 38,
    rooms: 5.6,
    bedrooms: 1.1,
    pop: 1800,
    occupancy: 2.7,
    salary: 165000,
    ocean: "NEAR BAY"
  },
  la_coastal: {
    label: "Los Angeles Coastal Basin",
    lat: 34.0195,
    lon: -118.4912,
    income: 6.2,
    age: 32,
    rooms: 5.8,
    bedrooms: 1.2,
    pop: 1600,
    occupancy: 2.8,
    salary: 140000,
    ocean: "<1H OCEAN"
  },
  sacramento_suburb: {
    label: "Sacramento Suburban Valley",
    lat: 38.5816,
    lon: -121.4944,
    income: 4.2,
    age: 22,
    rooms: 6.2,
    bedrooms: 1.1,
    pop: 1450,
    occupancy: 2.9,
    salary: 95000,
    ocean: "INLAND"
  },
  fresno_inland: {
    label: "Central Valley Inland",
    lat: 36.7468,
    lon: -119.7726,
    income: 2.8,
    age: 25,
    rooms: 5.2,
    bedrooms: 1.0,
    pop: 1500,
    occupancy: 3.2,
    salary: 68000,
    ocean: "INLAND"
  }
};

export default function EstimatorPage({ user }) {
  // Input fields
  const [lat, setLat] = useState(37.7749);
  const [lon, setLon] = useState(-122.4194);
  const [income, setIncome] = useState(4.5); // in $10k units
  const [age, setAge] = useState(28);
  const [rooms, setRooms] = useState(5.5);
  const [bedrooms, setBedrooms] = useState(1.1);
  const [pop, setPop] = useState(1500);
  const [occupancy, setOccupancy] = useState(2.8);
  const [salary, setSalary] = useState(120000);
  const [ocean, setOcean] = useState('<1H OCEAN');

  // Prediction state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Gemini state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    setLat(p.lat);
    setLon(p.lon);
    setIncome(p.income);
    setAge(p.age);
    setRooms(p.rooms);
    setBedrooms(p.bedrooms);
    setPop(p.pop);
    setOccupancy(p.occupancy);
    setSalary(p.salary);
    setOcean(p.ocean);
    setResult(null);
    setAiAnswer('');
  }

  function handleReset() {
    applyPreset('sf_bay');
  }

  async function handlePredict(e) {
    if (e) e.preventDefault();
    setError('');

    // Range Validation
    if (lat < 32.5 || lat > 42.0) {
      setError('Latitude must be within California bounds (32.5° to 42.0°).');
      return;
    }
    if (lon < -124.5 || lon > -114.0) {
      setError('Longitude must be within California bounds (-124.5° to -114.0°).');
      return;
    }
    if (income < 0.4 || income > 20.0) {
      setError('Median Income must be between $4,000 and $200,000.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        latitude: Number(lat),
        longitude: Number(lon),
        housing_median_age: Number(age),
        median_income: Number(income),
        avg_rooms: Number(rooms),
        avg_bedrooms: Number(bedrooms),
        avg_occupancy: Number(occupancy),
        population: Number(pop),
        annual_salary: Number(salary),
        ocean_proximity: ocean
      };

      const res = await api.predictions.predict(payload);
      setResult(res);
      setAiAnswer('');
    } catch (err) {
      setError(err.message || 'Model prediction failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAskGemini() {
    if (!result || !aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const context = {
        predicted_value: result.predicted_value,
        monthly_emi: result.monthly_emi,
        affordability_status: result.affordability_status,
        latitude: lat,
        longitude: lon,
        median_income: income,
        housing_median_age: age,
        ocean_proximity: ocean,
      };

      const res = await api.ai.ask(aiQuestion, context);
      setAiAnswer(res.answer);
    } catch (err) {
      setAiAnswer("Unable to reach the AI Assistant at this time. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Page Header */}
      <div style={{ maxWidth: '780px', marginBottom: '32px' }}>
        <span className="badge badge-purple" style={{ marginBottom: '8px' }}>
          Deep Neural Network Regression
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          Estimate Housing Value
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Input structural, demographic, and geographic characteristics to estimate median housing values using our validated 4-layer sequential neural network.
        </p>
      </div>

      {/* Preset Buttons Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Quick Archetype Presets:
        </span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className="brand-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleReset}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RotateCcw size={13} /> Reset Inputs
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#B91C1C',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '24px',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Inputs Left (60%), Prediction Results Right (40%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '28px',
        alignItems: 'start'
      }}>
        {/* INPUTS FORM */}
        <form onSubmit={handlePredict} className="card-luxury" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="var(--color-purple-dark)" />
            <span>Model Input Parameters</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Median Household Income */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Median Household Income</label>
                <strong style={{ color: 'var(--color-purple-dark)', fontSize: '0.92rem' }}>
                  ${(income * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })} / yr
                </strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.1"
                value={income}
                onChange={(e) => setIncome(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-purple)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>$5,000</span>
                <span>California Baseline: ~$35,300</span>
                <span>$150,000+</span>
              </div>
            </div>

            {/* Structure Median Age */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Structure Median Age</label>
                <strong style={{ fontSize: '0.92rem' }}>{age} Years</strong>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-purple)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>1 Year (New build)</span>
                <span>29 Years (Median)</span>
                <span>60+ Years (Historic)</span>
              </div>
            </div>

            {/* Geographic Coordinates: Lat / Lon */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Latitude (°N)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  className="form-input"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Range: 32.5 to 42.0</span>
              </div>
              <div>
                <label className="form-label">Longitude (°W)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  className="form-input"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Range: -124.5 to -114.0</span>
              </div>
            </div>

            {/* Coastal Proximity */}
            <div>
              <label className="form-label">Coastal Proximity Category</label>
              <select
                value={ocean}
                onChange={(e) => setOcean(e.target.value)}
                className="form-input"
              >
                <option value="<1H OCEAN">&lt;1H OCEAN (Suburban Coastal Basin)</option>
                <option value="INLAND">INLAND (Central Valley & Foothills)</option>
                <option value="NEAR BAY">NEAR BAY (San Francisco Bay Metro)</option>
                <option value="NEAR OCEAN">NEAR OCEAN (Direct Pacific Coastline)</option>
                <option value="ISLAND">ISLAND (Catalina / Channel Islands)</option>
              </select>
            </div>

            {/* Rooms and Bedrooms Ratio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Avg Rooms / Unit</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="15"
                  className="form-input"
                  value={rooms}
                  onChange={(e) => setRooms(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">Avg Bedrooms / Unit</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="8"
                  className="form-input"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Population and Occupancy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">District Population</label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  max="35000"
                  className="form-input"
                  value={pop}
                  onChange={(e) => setPop(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">Avg Occupancy (People/Unit)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  className="form-input"
                  value={occupancy}
                  onChange={(e) => setOccupancy(parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Household Salary (for affordability check) */}
            <div>
              <label className="form-label">Annual Household Salary (for EMI check)</label>
              <input
                type="number"
                step="5000"
                min="10000"
                className="form-input"
                value={salary}
                onChange={(e) => setSalary(parseInt(e.target.value))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brand-btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
            >
              <Calculator size={18} />
              <span>{loading ? 'Executing Neural Network...' : 'Calculate Model Estimate'}</span>
            </button>
          </div>
        </form>

        {/* RESULTS & EXPLAINABILITY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {result ? (
            <div className="card-luxury animate-fade-in" style={{ padding: '28px' }}>
              {/* Result Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-purple">Prediction Generated</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Model: {result.model_version}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Model-Estimated Median Housing Value
              </div>

              {/* Formatted Currency */}
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                margin: '6px 0 16px 0'
              }}>
                ${result.predicted_value?.toLocaleString()}
              </div>

              {/* Monthly EMI and Affordability Badge */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--color-purple-light)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Estimated Monthly EMI</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
                    ${result.monthly_emi?.toLocaleString()} / mo
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Affordability Rating</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                    {result.affordability_status}
                  </div>
                </div>
              </div>

              {/* Factors Attribution List */}
              {result.factors && result.factors.influences && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>
                    <span>Primary Driving Factors:</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.factors.influences.map((inf, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#FAFBFD',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong>{inf.factor}:</strong> {inf.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask Gemini Section */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                  <Bot size={18} color="var(--color-purple-dark)" />
                  <span>Explain this prediction</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Why is this estimate high or low?"
                    className="form-input"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAskGemini}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="brand-btn-primary"
                    style={{ padding: '8px 14px' }}
                  >
                    <Send size={15} />
                  </button>
                </div>

                {aiLoading && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Gemini is generating explanation...
                  </div>
                )}

                {aiAnswer && (
                  <div style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FAFBFD',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)'
                  }}>
                    <strong style={{ color: 'var(--color-purple-dark)' }}>Gemini Intelligence: </strong>
                    {aiAnswer}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standby Card */
            <div className="card-luxury" style={{ padding: '48px 28px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--color-purple-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Calculator size={26} color="var(--color-purple-dark)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Ready for Prediction</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                Configure the demographic and geographic variables on the left, then click <strong>"Calculate Model Estimate"</strong> to run the neural network.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
