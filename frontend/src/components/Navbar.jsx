import React, { useState } from 'react';
import { 
  Home, Compass, BarChart3, Calculator, Scale, 
  ShieldCheck, Heart, User as UserIcon, Menu, X, 
  LogOut, LayoutDashboard, Shield, DollarSign
} from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  user, 
  onOpenAuth, 
  onLogout,
  favoriteCount = 0,
  compareCount = 0
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Explore Housing Data', icon: Compass },
    { id: 'market', label: 'Market Insights', icon: BarChart3 },
    { id: 'estimator', label: 'Price Estimator', icon: Calculator },
    { id: 'affordability', label: 'Affordability', icon: DollarSign },
    { id: 'compare', label: 'Compare', icon: Scale, badge: compareCount > 0 ? compareCount : null },
    { id: 'trust', label: 'Data & Trust', icon: ShieldCheck },
  ];

  function handleNav(pageId) {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('landing')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--grad-purple-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(178, 152, 231, 0.4)',
          }}>
            <Home size={22} color="#17152B" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.18rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}>
              California Housing
            </div>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-purple-dark)',
            }}>
              Intelligence Platform
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '6px',
        }} className="desktop-nav">
          <style>{`
            @media (min-width: 960px) {
              .desktop-nav { display: flex !important; }
              .mobile-toggle { display: none !important; }
            }
          `}</style>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: active ? 'var(--color-purple-light)' : 'transparent',
                  color: active ? 'var(--color-purple-dark)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <Icon size={17} color={active ? 'var(--color-purple-dark)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'var(--color-pink)',
                    color: '#17152B',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Saved Items Button */}
          {user && (
            <button
              onClick={() => handleNav('dashboard')}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-color)',
                background: '#FFFFFF',
                color: 'var(--text-primary)',
              }}
              title="Saved Districts"
            >
              <Heart size={18} color="var(--color-purple-dark)" />
              {favoriteCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-pink)',
                  color: '#17152B',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {favoriteCount}
                </span>
              )}
            </button>
          )}

          {/* User Authentication Menu */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                id="user-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border-color)',
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--grad-purple-pink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#17152B',
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span>{user.username}</span>
                {user.role === 'admin' && (
                  <span className="badge badge-purple" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Admin</span>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  minWidth: '200px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 2000,
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.full_name || user.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                  <button
                    id="my-dashboard-link"
                    onClick={() => handleNav('dashboard')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-purple-light)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <LayoutDashboard size={16} />
                    <span>My Dashboard</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      id="admin-portal-link"
                      onClick={() => handleNav('admin')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'left',
                        fontSize: '0.88rem',
                        color: 'var(--color-purple-dark)',
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-purple-light)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <Shield size={16} />
                      <span>Admin Portal</span>
                    </button>
                  )}

                  <button
                    id="sign-out-btn"
                    onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                      color: '#DC2626',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="brand-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="brand-btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            style={{
              padding: '8px',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: '#FFFFFF',
              color: 'var(--text-primary)',
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: active ? 'var(--color-purple-light)' : 'transparent',
                  color: active ? 'var(--color-purple-dark)' : 'var(--text-primary)',
                  fontWeight: active ? 600 : 500,
                  fontSize: '1rem',
                  textAlign: 'left',
                }}
              >
                <Icon size={19} color={active ? 'var(--color-purple-dark)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    background: 'var(--color-pink)',
                    color: '#17152B',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
