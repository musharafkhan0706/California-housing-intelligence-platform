import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        if (!emailOrUsername || !password) {
          throw new Error('Please enter your username/email and password.');
        }
        res = await api.auth.login(emailOrUsername, password);
      } else {
        if (!email || !username || !password) {
          throw new Error('Please fill in all required fields.');
        }
        res = await api.auth.register({
          email,
          username,
          full_name: fullName,
          password
        });
      }

      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo(role) {
    if (role === 'admin') {
      setEmailOrUsername('admin@housingintel.ca');
      setPassword('AdminPass123!');
      setMode('login');
    } else {
      setEmailOrUsername('demo@housingintel.ca');
      setPassword('DemoPass123!');
      setMode('login');
    }
    setError('');
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(23, 21, 43, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '16px'
    }}>
      <div className="card-luxury animate-fade-in" style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        padding: '32px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Close Button */}
        <button
          aria-label="Close modal"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--grad-purple-pink)',
            margin: '0 auto 12px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lock size={22} color="#17152B" />
          </div>
          <h3 style={{ fontSize: '1.45rem', marginBottom: '6px' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            {mode === 'login' 
              ? 'Access saved searches, personal notes, and prediction history.' 
              : 'Join the California Housing Intelligence Platform today.'}
          </p>
        </div>

        {/* Quick Demo Credentials Autofill */}
        <div style={{
          backgroundColor: 'var(--color-purple-light)',
          border: '1px dashed var(--color-purple)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-purple-dark)', marginBottom: '6px' }}>
            One-Click Quick Fill Demo:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('resident')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              Demo Resident
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-purple-dark)'
              }}
            >
              Administrator
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="california_scout"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="form-label">Email or Username</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="demo@housingintel.ca or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="form-label">Password *</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brand-btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-purple-dark)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-purple-dark)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
