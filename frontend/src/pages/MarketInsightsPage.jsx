import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Home, Compass } from 'lucide-react';
import { api } from '../api';

export default function MarketInsightsPage() {
  const [overview, setOverview] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  async function fetchMarketData() {
    setLoading(true);
    try {
      const [ov, dist, reg] = await Promise.all([
        api.market.getOverview(),
        api.market.getDistributions(),
        api.market.getRegions()
      ]);
      setOverview(ov);
      setDistributions(dist);
      setRegions(reg);
    } catch (err) {
      console.error("Error loading market data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Generating statewide market analytics...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Page Title */}
      <div style={{ maxWidth: '800px', marginBottom: '32px' }}>
        <span className="badge badge-purple" style={{ marginBottom: '8px' }}>
          Statewide Macro Intelligence
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          California Housing Market Insights
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Aggregated distributions, regional value patterns, and demographic characteristics computed across 20,640 historical California housing records.
        </p>
      </div>

      {/* Top Level Metric KPIs */}
      {overview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '36px'
        }}>
          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>State Average Estimated Value</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-purple-dark)', margin: '4px 0' }}>
              ${overview.average_estimated_value?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>20,640 Housing Records</div>
          </div>

          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Household Income</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '4px 0' }}>
              ${overview.average_median_income?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Median Income</div>
          </div>

          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Structure Age</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '4px 0' }}>
              {overview.average_house_age_years} yrs
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Statewide Median Structure Age</div>
          </div>

          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rooms & Density</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '4px 0' }}>
              {overview.average_rooms_per_household}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rooms/Household • {overview.average_occupancy_per_household} people/unit</div>
          </div>
        </div>
      )}

      {/* Visual Distribution Charts Grid */}
      {distributions && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
          marginBottom: '36px'
        }}>
          {/* Price Distribution Bar Chart */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--color-purple-dark)" />
              <span>Estimated Value Distribution</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Housing records grouped by estimated median value:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distributions.price_distribution.map((tier, idx) => {
                const maxCount = Math.max(...distributions.price_distribution.map(t => t.count));
                const pct = ((tier.count / maxCount) * 100).toFixed(0);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{tier.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{tier.count.toLocaleString()} records</span>
                    </div>
                    <div style={{ height: '22px', backgroundColor: '#F1F3F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--grad-purple-pink)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Income Distribution Bar Chart */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-cyan-dark)" />
              <span>Area Median Income Distribution</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Housing records grouped by annual median household income bracket:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distributions.income_distribution.map((tier, idx) => {
                const maxCount = Math.max(...distributions.income_distribution.map(t => t.count));
                const pct = ((tier.count / maxCount) * 100).toFixed(0);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{tier.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{tier.count.toLocaleString()} records</span>
                    </div>
                    <div style={{ height: '22px', backgroundColor: '#F1F3F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--grad-cyan-purple)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coastal Proximity Premium Breakdown */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--color-pink-dark)" />
              <span>Estimated Value by Coastal Proximity</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Average estimated value across geographic proximity classifications:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {distributions.ocean_proximity_distribution.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FAFBFD',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.88rem'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.proximity}</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.count.toLocaleString()} records</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
                      ${item.avg_estimated_value?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Average Estimated Value</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Structure Age Brackets */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} color="var(--color-purple-dark)" />
              <span>Housing Stock Age Composition</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Distribution of housing records by structure age:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distributions.age_distribution.map((tier, idx) => {
                const totalDistricts = 20640;
                const pct = ((tier.count / totalDistricts) * 100).toFixed(1);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{tier.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{tier.count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ height: '20px', backgroundColor: '#F1F3F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #B298E7 0%, #B8E3E9 100%)',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Regional Comparison Table */}
      {regions.length > 0 && (
        <div className="card-luxury" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>
            California Regional Benchmarks
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Comparative summary across California's macro economic and geographic regions:
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Region</th>
                  <th style={{ padding: '12px 16px' }}>Housing Records</th>
                  <th style={{ padding: '12px 16px' }}>Avg Estimated Value</th>
                  <th style={{ padding: '12px 16px' }}>Avg Household Income</th>
                  <th style={{ padding: '12px 16px' }}>Avg Structure Age</th>
                  <th style={{ padding: '12px 16px' }}>Avg Rooms</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {r.region}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{r.districts.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
                      ${r.avg_price?.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      ${r.avg_income?.toLocaleString(undefined, { maximumFractionDigits: 0 })} / yr
                    </td>
                    <td style={{ padding: '14px 16px' }}>{r.avg_age} yrs</td>
                    <td style={{ padding: '14px 16px' }}>{r.avg_rooms} rooms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
