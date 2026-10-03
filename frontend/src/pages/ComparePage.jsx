import React, { useState, useEffect } from 'react';
import { Scale, Trash2, Plus, ArrowRight, Eye, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function ComparePage({ comparedIds = [], onRemoveFromCompare, onClearCompare, onSelectDistrict, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (comparedIds.length > 0) {
      loadComparison();
    } else {
      setData(null);
    }
  }, [comparedIds]);

  async function loadComparison() {
    setLoading(true);
    setError('');
    try {
      const res = await api.compare.fetchComparison(comparedIds);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load comparison data.');
    } finally {
      setLoading(false);
    }
  }

  if (comparedIds.length === 0) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="card-luxury" style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>
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
            <Scale size={26} color="var(--color-purple-dark)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Compare housing records side by side</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.55 }}>
            Select records from the Explore Housing Data page to compare their housing characteristics, estimated values, and other metrics side by side.
          </p>
          <button onClick={() => onNavigate('explore')} className="brand-btn-primary">
            Explore Housing Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '8px' }}>
            Multi-District Benchmark
          </span>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>
            Compare Housing Districts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Side-by-side evaluation of {comparedIds.length} California census district records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate('explore')} className="brand-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Plus size={15} /> Add More
          </button>
          <button onClick={onClearCompare} className="brand-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#DC2626' }}>
            <Trash2 size={15} /> Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing side-by-side differentials...
        </div>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      ) : data ? (
        <div>
          {/* Group Benchmark Summary */}
          {data.group_averages && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              backgroundColor: '#FFFFFF',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '24px'
            }}>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Selected Group Benchmarks:</strong>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Group Avg Valuation: </span>
                <strong style={{ color: 'var(--color-purple-dark)' }}>${data.group_averages.avg_estimated_value?.toLocaleString()}</strong>
              </div>
              <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Group Avg Income: </span>
                <strong>${data.group_averages.avg_median_income?.toLocaleString()} / yr</strong>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Table */}
          <div className="card-luxury" style={{ overflowX: 'auto', padding: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Metric</th>
                  {data.records.map((r) => (
                    <th key={r.id} style={{ padding: '16px 20px', minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-purple-dark)', fontSize: '1rem' }}>
                          {r.district_code}
                        </span>
                        <button
                          onClick={() => onRemoveFromCompare(r.id)}
                          style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Remove from comparison"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {r.region_name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Estimated Value */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Estimated Valuation</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ${r.estimated_value?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: r.price_diff_from_group_pct >= 0 ? '#059669' : '#DC2626' }}>
                        {r.price_diff_from_group_pct >= 0 ? `+${r.price_diff_from_group_pct}%` : `${r.price_diff_from_group_pct}%`} vs group
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Median Income */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Median Income</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      <strong>${(r.median_income * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </td>
                  ))}
                </tr>

                {/* Structure Age */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Median Structure Age</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      {r.housing_median_age} Years
                    </td>
                  ))}
                </tr>

                {/* Rooms per household */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Avg Rooms / Unit</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      {r.avg_rooms_per_household}
                    </td>
                  ))}
                </tr>

                {/* Avg Occupancy */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Avg Occupancy</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      {r.avg_occupancy} People/Unit
                    </td>
                  ))}
                </tr>

                {/* Coastal Proximity */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Coastal Proximity</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      <span className="badge badge-purple">{r.ocean_proximity}</span>
                    </td>
                  ))}
                </tr>

                {/* Population */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Population Density</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '14px 20px' }}>
                      {r.population?.toLocaleString()} residents
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Inspection</td>
                  {data.records.map((r) => (
                    <td key={r.id} style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => onSelectDistrict(r.id)}
                        className="brand-btn-primary"
                        style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} /> Full Details
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
