import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, RotateCcw } from 'lucide-react';
import { api } from '../api';

export default function AffordabilityPage() {
  const [propertyValue, setPropertyValue] = useState(450000);
  const [annualIncome, setAnnualIncome] = useState(130000);
  const [downPayment, setDownPayment] = useState(90000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState(30);
  const [monthlyDebts, setMonthlyDebts] = useState(450);

  const [calc, setCalc] = useState(null);

  const recalculate = useCallback(async () => {
    try {
      const res = await api.affordability.calculate({
        property_value: Number(propertyValue),
        annual_income: Number(annualIncome),
        down_payment: Number(downPayment),
        interest_rate: Number(interestRate),
        loan_term_years: Number(termYears),
        monthly_debts: Number(monthlyDebts)
      });
      setCalc(res);
    } catch (err) {
      console.error("Affordability calculation error:", err);
    }
  }, [propertyValue, annualIncome, downPayment, interestRate, termYears, monthlyDebts]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);


  function handleReset() {
    setPropertyValue(450000);
    setAnnualIncome(130000);
    setDownPayment(90000);
    setInterestRate(6.5);
    setTermYears(30);
    setMonthlyDebts(450);
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ maxWidth: '780px', marginBottom: '32px' }}>
        <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>
          Mortgage & Financial Intelligence
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          Affordability & EMI Planner
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Evaluate debt-to-income (DTI) metrics, estimated California property tax allocations, and monthly mortgage obligations based on customizable financial parameters.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '28px',
        alignItems: 'start'
      }}>
        {/* INPUTS COLUMN */}
        <div className="card-luxury" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="var(--color-purple-dark)" />
              <span>Financial Assumptions</span>
            </h3>
            <button
              onClick={handleReset}
              style={{
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
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Target Property Value */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Target Housing Value ($)</label>
                <strong style={{ fontSize: '0.95rem', color: 'var(--color-purple-dark)' }}>
                  ${Number(propertyValue).toLocaleString()}
                </strong>
              </div>
              <input
                type="number"
                step="10000"
                className="form-input"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
              />
            </div>

            {/* Down Payment */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Down Payment ($)</label>
                <strong style={{ fontSize: '0.92rem' }}>
                  ${Number(downPayment).toLocaleString()} ({calc ? calc.down_payment_pct : 20}%)
                </strong>
              </div>
              <input
                type="number"
                step="5000"
                className="form-input"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>

            {/* Annual Household Income */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Gross Annual Income ($)</label>
                <strong style={{ fontSize: '0.92rem' }}>
                  ${Number(annualIncome).toLocaleString()} / yr
                </strong>
              </div>
              <input
                type="number"
                step="5000"
                className="form-input"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
              />
            </div>

            {/* Interest Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Mortgage Interest Rate (%)</label>
                <strong style={{ fontSize: '0.92rem' }}>{interestRate}%</strong>
              </div>
              <input
                type="range"
                min="3.0"
                max="12.0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-purple)' }}
              />
            </div>

            {/* Loan Term */}
            <div>
              <label className="form-label">Loan Term (Years)</label>
              <select
                value={termYears}
                onChange={(e) => setTermYears(parseInt(e.target.value))}
                className="form-input"
              >
                <option value={15}>15-Year Fixed</option>
                <option value={20}>20-Year Fixed</option>
                <option value={30}>30-Year Fixed (Standard)</option>
              </select>
            </div>

            {/* Existing Monthly Debt */}
            <div>
              <label className="form-label">Existing Monthly Debts (Car, Student loans, Credit cards)</label>
              <input
                type="number"
                step="50"
                className="form-input"
                value={monthlyDebts}
                onChange={(e) => setMonthlyDebts(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RESULTS BREAKDOWN COLUMN */}
        {calc && (
          <div className="card-luxury animate-fade-in" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="badge badge-purple">Estimated Monthly Housing Cost</span>
              <span className={`badge ${
                calc.affordability_status === 'Comfortable' ? 'badge-cyan' :
                calc.affordability_status === 'Moderate' ? 'badge-purple' : 'badge-pink'
              }`}>
                {calc.affordability_status}
              </span>
            </div>

            {/* Total Monthly Payment */}
            <div style={{ fontSize: '2.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '4px 0 16px 0' }}>
              ${calc.total_monthly_payment?.toLocaleString()}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
            </div>

            {/* Payment Component Breakdown */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '16px',
              backgroundColor: '#FAFBFD',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Principal & Interest (P&I)</span>
                <strong>${calc.monthly_principal_interest?.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Est. CA Property Tax (~1.1%/yr)</span>
                <strong>${calc.estimated_property_tax?.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Est. Hazard Home Insurance</span>
                <strong>${calc.estimated_insurance?.toLocaleString()}</strong>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                <span style={{ fontWeight: 600 }}>Loan Amount Financed</span>
                <strong>${calc.loan_amount?.toLocaleString()}</strong>
              </div>
            </div>

            {/* DTI Ratios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-purple-light)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Front-End DTI (Housing Only)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
                  {calc.front_end_dti}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &lt; 28%</div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-purple-light)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Back-End DTI (All Debts)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
                  {calc.back_end_dti}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &lt; 36%</div>
              </div>
            </div>

            {/* Recommendation Analysis */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              color: 'var(--text-secondary)'
            }}>
              <strong>Budgeting Guidance: </strong> {calc.recommendation}
            </div>
          </div>
        )}
      </div>

      {/* Regulatory Disclaimers (Phase 14) */}
      <div style={{
        marginTop: '32px',
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#FAF8FE',
        border: '1px solid var(--border-color)',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6
      }}>
        <strong>Regulatory and Legal Disclosure:</strong> All mortgage calculations, property tax assessments, and debt-to-income evaluations are educational estimates for comparative budgeting purposes. This does not represent an application for credit, loan pre-approval, or a commitment to lend. Mortgage rates, insurance premiums, and tax rates vary by municipality, lender underwriting, and individual creditworthiness.
      </div>
    </div>
  );
}
