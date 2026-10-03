import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Activity, ArrowLeft } from 'lucide-react';
import { api } from '../api';

export default function AdminDashboardPage({ user, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, uList, logs, h] = await Promise.all([
        api.admin.getOverview(),
        api.admin.getUsers(),
        api.admin.getAuditLogs(),
        api.admin.getSystemHealth()
      ]);
      setOverview(ov);
      setUsersList(uList);
      setAuditLogs(logs);
      setHealth(h);
    } catch (err) {
      setError(err.message || 'Administrative access restricted or failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  async function handleToggleUserStatus(userId, currentStatus) {
    try {
      await api.admin.toggleUserStatus(userId, !currentStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      alert("Status toggle failed: " + err.message);
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="card-luxury" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px' }}>
          <Shield size={36} color="#DC2626" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Administrative privileges required. Please log in with an authorized administrator account.
          </p>
          <button onClick={() => onNavigate('landing')} className="brand-btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading administrative telemetry...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Admin Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-purple">Administrative Portal</span>
            <span className="badge badge-cyan">{health?.status === 'healthy' ? 'System Operational' : 'Degraded'}</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>
            Platform Operations & Administration
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Manage platform users, inspect model metrics, and review system audit logs.
          </p>
        </div>

        <button onClick={() => onNavigate('dashboard')} className="brand-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <ArrowLeft size={15} /> My User Dashboard
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* KPI Cards Row */}
      {overview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Users</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-purple-dark)', margin: '4px 0' }}>
              {overview.metrics.total_users}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669' }}>{overview.metrics.active_users} Active Accounts</div>
          </div>

          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predictions Generated</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
              {overview.metrics.predictions_generated}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Neural Net Executions</div>
          </div>

          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dataset Records</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
              {overview.metrics.dataset_records?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indexed Census Districts</div>
          </div>

          <div className="card-luxury" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Database Latency</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
              {health?.database_latency_ms} ms
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SQLite Local Engine</div>
          </div>
        </div>
      )}

      {/* Two Column Layout: User Management (Left) & Audit Logs + Health (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '28px',
        alignItems: 'start'
      }}>
        {/* User Management Card */}
        <div className="card-luxury" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--color-purple-dark)" />
            <span>Registered Users Management</span>
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '8px 12px' }}>User</th>
                  <th style={{ padding: '8px 12px' }}>Role</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{u.username}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-neutral'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: u.is_active ? '#059669' : '#DC2626', fontWeight: 600, fontSize: '0.8rem' }}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: u.is_active ? '#FEF2F2' : '#F0FDF4',
                            color: u.is_active ? '#DC2626' : '#059669',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs & System Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* System Health Card */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#059669" />
              <span>System & Engine Health</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Inference Engine</span>
                <strong>{health?.ml_inference_engine || "Vectorized NumPy Engine (<1ms)"}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database Latency</span>
                <strong>{health?.database_latency_ms} ms</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gemini AI Service</span>
                <strong>{health?.gemini_integration}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Server Uptime</span>
                <strong>{health?.server_uptime_seconds}s</strong>
              </div>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="card-luxury" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              Security & Audit Logs
            </h3>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FAFBFD',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: 'var(--color-purple-dark)' }}>{log.action}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
