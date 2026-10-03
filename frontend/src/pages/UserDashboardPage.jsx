import React, { useState, useEffect } from 'react';
import { 
  Heart, Calculator, BookmarkPlus, 
  Trash2, Eye, User 
} from 'lucide-react';
import { api } from '../api';

export default function UserDashboardPage({ 
  user, 
  onSelectDistrict, 
  onNavigate,
  onOpenAuth 
}) {
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites', 'predictions', 'searches'
  const [favorites, setFavorites] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [favs, preds, searches] = await Promise.all([
        api.favorites.list(),
        api.predictions.getHistory(),
        api.savedSearches.list(),
      ]);
      setFavorites(favs || []);
      setPredictions(preds || []);
      setSavedSearches(searches || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFavorite(recordId) {
    try {
      await api.favorites.remove(recordId);
      setFavorites((prev) => prev.filter((f) => f.housing_record_id !== recordId));
    } catch (err) {
      alert("Failed to remove favorite: " + err.message);
    }
  }

  async function handleDeleteSavedSearch(id) {
    try {
      await api.savedSearches.delete(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete saved search: " + err.message);
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="card-luxury" style={{ maxWidth: '500px', margin: '0 auto', padding: '48px 24px' }}>
          <User size={36} color="var(--color-purple-dark)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Sign in to view your dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Saved districts, prediction history, and custom search filters are securely stored in your personal account.
          </p>
          <button onClick={() => onOpenAuth('login')} className="brand-btn-primary">
            Sign In to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Dashboard Top Header */}
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
            Personal Intelligence Hub
          </span>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>
            Welcome, {user.full_name || user.username}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Manage saved districts, review neural network estimation history, and run saved searches.
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div className="card-luxury" style={{ padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
              {favorites.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved Districts</div>
          </div>
          <div className="card-luxury" style={{ padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-cyan-dark)' }}>
              {predictions.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predictions Run</div>
          </div>
          <div className="card-luxury" style={{ padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-pink-dark)' }}>
              {savedSearches.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved Searches</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '24px'
      }}>
        {[
          { id: 'favorites', label: `Saved Districts (${favorites.length})`, icon: Heart },
          { id: 'predictions', label: `Prediction History (${predictions.length})`, icon: Calculator },
          { id: 'searches', label: `Saved Searches (${savedSearches.length})`, icon: BookmarkPlus },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                borderBottom: active ? '2.5px solid var(--color-purple)' : '2.5px solid transparent',
                color: active ? 'var(--color-purple-dark)' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: FAVORITES */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="card-luxury" style={{ padding: '48px', textAlign: 'center' }}>
              <Heart size={32} color="var(--color-purple-dark)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Your saved housing records will appear here</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Browse housing records in the explorer and click the heart icon to save records with personal notes.
              </p>
              <button onClick={() => onNavigate('explore')} className="brand-btn-primary">
                Explore California Housing
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {favorites.map((fav) => {
                const r = fav.housing_record;
                if (!r) return null;
                return (
                  <div key={fav.id} className="card-luxury" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-purple-dark)', fontSize: '0.95rem' }}>
                          {r.district_code}
                        </span>
                        <button
                          onClick={() => handleRemoveFavorite(fav.housing_record_id)}
                          style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer' }}
                          title="Remove from favorites"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                        ${r.estimated_value?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        {r.region_name} • {r.county_name}
                      </div>

                      {fav.personal_note && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-purple-light)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '14px',
                          fontStyle: 'italic'
                        }}>
                          "{fav.personal_note}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectDistrict(r.id)}
                      className="brand-btn-secondary"
                      style={{ width: '100%', padding: '8px', fontSize: '0.84rem' }}
                    >
                      <Eye size={14} /> View District Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PREDICTIONS HISTORY */}
      {activeTab === 'predictions' && (
        <div>
          {predictions.length === 0 ? (
            <div className="card-luxury" style={{ padding: '48px', textAlign: 'center' }}>
              <Calculator size={32} color="var(--color-purple-dark)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Your previous estimates will appear here</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Run housing value predictions with custom demographic variables.
              </p>
              <button onClick={() => onNavigate('estimator')} className="brand-btn-primary">
                Launch Price Estimator
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {predictions.map((p) => (
                <div key={p.id} className="card-luxury" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-purple">{p.model_version}</span>
                      <span className="badge badge-cyan">{p.affordability_status}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      ${p.predicted_value?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.location_name} • Est. EMI: ${p.monthly_emi?.toLocaleString()} / mo
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                    Income: ${(p.inputs?.median_income * 10000).toLocaleString()} • Age: {p.inputs?.housing_median_age} yrs • Rooms: {p.inputs?.avg_rooms_per_household}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SAVED SEARCHES */}
      {activeTab === 'searches' && (
        <div>
          {savedSearches.length === 0 ? (
            <div className="card-luxury" style={{ padding: '48px', textAlign: 'center' }}>
              <BookmarkPlus size={32} color="var(--color-purple-dark)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No saved search criteria yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Save your favorite filter configurations on the Explore Housing Data page for instant one-click execution.
              </p>
              <button onClick={() => onNavigate('explore')} className="brand-btn-primary">
                Explore Housing Data
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedSearches.map((s) => (
                <div key={s.id} className="card-luxury" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{s.title}</h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Saved on {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onNavigate('explore')}
                      className="brand-btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Run Search
                    </button>
                    <button
                      onClick={() => handleDeleteSavedSearch(s.id)}
                      style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
