import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, SlidersHorizontal, RotateCcw, Map as MapIcon, 
  Grid, List, Heart, Scale, Eye, BookmarkPlus, 
  MapPin, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../api';

const REGIONS = [
  "San Francisco Bay Area",
  "Greater Los Angeles",
  "San Diego Metro",
  "Sacramento & Capital Region",
  "Central Coast",
  "Central Valley",
  "Inland Empire",
  "Northern California & Sierra"
];

const OCEAN_CATEGORIES = [
  "<1H OCEAN",
  "INLAND",
  "NEAR BAY",
  "NEAR OCEAN",
  "ISLAND"
];

export default function ExplorePage({ 
  onSelectDistrict, 
  onToggleCompare, 
  comparedIds = [], 
  onToggleFavorite, 
  favoriteIds = [],
  user
}) {
  // Filters State
  const [search, setSearch] = useState('');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedOcean, setSelectedOcean] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minIncome, setMinIncome] = useState('');
  const [maxIncome, setMaxIncome] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [sortBy, setSortBy] = useState('estimated_value_desc');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showMap, setShowMap] = useState(true);

  // Data State
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summaryStats, setSummaryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [geoPoints, setGeoPoints] = useState([]);
  const [saveSearchSuccess, setSaveSearchSuccess] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        page_size: 12,
        sort_by: sortBy,
      };

      if (search) params.search = search;
      if (selectedRegions.length > 0) params.region = selectedRegions;
      if (selectedOcean.length > 0) params.ocean_proximity = selectedOcean;
      if (minPrice) params.min_price = Number(minPrice);
      if (maxPrice) params.max_price = Number(maxPrice);
      if (minIncome) params.min_income = Number(minIncome) / 10000;
      if (maxIncome) params.max_income = Number(maxIncome) / 10000;
      if (minAge) params.min_age = Number(minAge);
      if (maxAge) params.max_age = Number(maxAge);

      const res = await api.housing.getRecords(params);
      setRecords(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setSummaryStats(res.summary_stats);
    } catch (err) {
      setError(err.message || 'Failed to load housing records.');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, selectedRegions, selectedOcean, search, minPrice, maxPrice, minIncome, maxIncome, minAge, maxAge]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    async function fetchGeoPoints() {
      try {
        const data = await api.housing.getGeoPoints(350);
        setGeoPoints(data);
      } catch (err) {
        console.error("Geo points loading error:", err);
      }
    }
    fetchGeoPoints();
  }, []);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  }

  function handleResetFilters() {
    setSearch('');
    setSelectedRegions([]);
    setSelectedOcean([]);
    setMinPrice('');
    setMaxPrice('');
    setMinIncome('');
    setMaxIncome('');
    setMinAge('');
    setMaxAge('');
    setSortBy('estimated_value_desc');
    setPage(1);
  }

  function toggleRegion(r) {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
    setPage(1);
  }

  function toggleOcean(o) {
    setSelectedOcean((prev) =>
      prev.includes(o) ? prev.filter((item) => item !== o) : [...prev, o]
    );
    setPage(1);
  }

  async function handleSaveSearch() {
    if (!user) {
      alert("Please sign in to save search criteria.");
      return;
    }
    const title = prompt("Enter a title for this saved search:", "California Search");
    if (!title) return;

    try {
      await api.savedSearches.create(title, {
        search,
        selectedRegions,
        selectedOcean,
        minPrice,
        maxPrice,
        minIncome,
        maxIncome,
      });
      setSaveSearchSuccess(true);
      setTimeout(() => setSaveSearchSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save search: " + err.message);
    }
  }

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Page Title & Stats Overview */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '8px' }}>
            California Housing Discovery
          </span>
          <h1 style={{ fontSize: '2.1rem', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Explore California Housing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Browse 20,640 historical housing records. All values reflect model-generated estimations and historical block group data.
          </p>
        </div>

        {/* Aggregate Stats Summary Pill */}
        {summaryStats && summaryStats.avg_estimated_value > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Valuation</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-purple-dark)' }}>
                ${summaryStats.avg_estimated_value?.toLocaleString()}
              </div>
            </div>
            <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Median Income</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${(summaryStats.avg_median_income * 10000)?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Structure Age</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {summaryStats.avg_house_age} yrs
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Filters, Center Results, Right Map */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showMap ? '280px 1fr 340px' : '280px 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: FILTERS */}
        <aside className="card-luxury" style={{ padding: '20px', position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem' }}>
              <SlidersHorizontal size={18} color="var(--color-purple-dark)" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
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
              title="Reset all filters"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search Input */}
            <div>
              <label className="form-label">Search Record / County</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CAD-0012 or Bay Area"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="form-label">Estimated Price ($)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Median Income */}
            <div>
              <label className="form-label">Household Income ($/yr)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min ($)"
                  className="form-input"
                  value={minIncome}
                  onChange={(e) => setMinIncome(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max ($)"
                  className="form-input"
                  value={maxIncome}
                  onChange={(e) => setMaxIncome(e.target.value)}
                />
              </div>
            </div>

            {/* House Age */}
            <div>
              <label className="form-label">Median Structure Age</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min Yrs"
                  className="form-input"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max Yrs"
                  className="form-input"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                />
              </div>
            </div>

            {/* Regions Checkboxes */}
            <div>
              <label className="form-label">California Regions</label>
              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {REGIONS.map((r) => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(r)}
                      onChange={() => toggleRegion(r)}
                      style={{ accentColor: 'var(--color-purple)' }}
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Coastal Proximity */}
            <div>
              <label className="form-label">Coastal Proximity</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {OCEAN_CATEGORIES.map((o) => (
                  <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedOcean.includes(o)}
                      onChange={() => toggleOcean(o)}
                      style={{ accentColor: 'var(--color-purple)' }}
                    />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="brand-btn-primary" style={{ width: '100%', padding: '10px' }}>
              Apply Filters
            </button>

            {user && (
              <button
                type="button"
                onClick={handleSaveSearch}
                className="brand-btn-secondary"
                style={{ width: '100%', padding: '8px', fontSize: '0.84rem' }}
              >
                <BookmarkPlus size={15} />
                <span>{saveSearchSuccess ? 'Search Saved!' : 'Save Search Criteria'}</span>
              </button>
            )}
          </form>
        </aside>

        {/* CENTER COLUMN: RESULTS */}
        <div>
          {/* Controls Bar: Count, Sort, Grid/List, Map Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{records.length}</strong> of <strong>{total.toLocaleString()}</strong> housing records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Sort Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="form-input"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                >
                  <option value="estimated_value_desc">Valuation: High to Low</option>
                  <option value="estimated_value_asc">Valuation: Low to High</option>
                  <option value="income_desc">Area Income: High to Low</option>
                  <option value="income_asc">Area Income: Low to High</option>
                  <option value="age_desc">Structure Age: Oldest First</option>
                  <option value="age_asc">Structure Age: Newest First</option>
                  <option value="rooms_desc">Avg Rooms: Most First</option>
                  <option value="district_asc">District Code (CAD-XXXXX)</option>
                </select>
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--color-purple-light)' : '#FFFFFF',
                    color: viewMode === 'grid' ? 'var(--color-purple-dark)' : 'var(--text-muted)',
                  }}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    background: viewMode === 'list' ? 'var(--color-purple-light)' : '#FFFFFF',
                    color: viewMode === 'list' ? 'var(--color-purple-dark)' : 'var(--text-muted)',
                  }}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Map Toggle */}
              <button
                onClick={() => setShowMap(!showMap)}
                className="brand-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                <MapIcon size={15} />
                <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
              gap: '18px'
            }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-luxury" style={{ height: '240px', padding: '20px', backgroundColor: '#FAFBFD' }}>
                  <div style={{ height: '20px', width: '40%', background: '#E2E8F0', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '32px', width: '60%', background: '#E2E8F0', borderRadius: '4px', marginBottom: '18px' }} />
                  <div style={{ height: '60px', width: '100%', background: '#E2E8F0', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '30px', width: '100%', background: '#E2E8F0', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            /* Empty State */
            <div className="card-luxury" style={{ padding: '56px 24px', textAlign: 'center' }}>
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
                <Search size={24} color="var(--color-purple-dark)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No housing records match your current filters</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Try relaxing your price constraints or clearing selected geographic regions.
              </p>
              <button onClick={handleResetFilters} className="brand-btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            /* Results Cards */
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
              gap: '18px'
            }}>
              {records.map((r) => {
                const isFavorite = favoriteIds.includes(r.id);
                const isCompared = comparedIds.includes(r.id);

                return (
                  <div
                    key={r.id}
                    className="card-luxury animate-fade-in"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Top District Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-purple-dark)' }}>
                          {r.district_code}
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                          Model/Data Estimate
                        </span>
                      </div>

                      {/* Estimated Value */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Estimated Median Valuation
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                          ${r.estimated_value?.toLocaleString()}
                        </div>
                      </div>

                      {/* Region & County */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '14px' }}>
                        <MapPin size={14} color="var(--color-purple-dark)" style={{ flexShrink: 0 }} />
                        <span>{r.region_name} • {r.county_name}</span>
                      </div>

                      {/* Characteristics Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                        padding: '10px',
                        backgroundColor: '#FAFBFD',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Income: </span>
                          <strong>${(r.median_income * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Age: </span>
                          <strong>{r.housing_median_age} yrs</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Rooms/Unit: </span>
                          <strong>{r.avg_rooms_per_household}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Proximity: </span>
                          <strong>{r.ocean_proximity}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px'
                    }}>
                      <button
                        onClick={() => onSelectDistrict(r.id)}
                        className="brand-btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
                      >
                        <Eye size={15} />
                        <span>View Details</span>
                      </button>

                      {/* Save Favorite Button */}
                      <button
                        onClick={() => onToggleFavorite(r.id)}
                        style={{
                          padding: '8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: isFavorite ? 'var(--color-pink-light)' : '#FFFFFF',
                          color: isFavorite ? 'var(--color-pink-dark)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                        title={isFavorite ? "Remove from saved" : "Save housing record"}
                      >
                        <Heart size={16} fill={isFavorite ? 'var(--color-pink-dark)' : 'none'} />
                      </button>

                      {/* Compare Button */}
                      <button
                        onClick={() => onToggleCompare(r.id)}
                        style={{
                          padding: '8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: isCompared ? 'var(--color-purple-light)' : '#FFFFFF',
                          color: isCompared ? 'var(--color-purple-dark)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                        title={isCompared ? "Remove from comparison" : "Add to comparison"}
                      >
                        <Scale size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '36px'
            }}>
              <button
                disabled={page <= 1}
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="brand-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.88rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="brand-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.88rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CALIFORNIA MAP */}
        {showMap && (
          <aside className="card-luxury" style={{
            position: 'sticky',
            top: '90px',
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAFBFD'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.88rem' }}>
                <MapPin size={16} color="var(--color-purple-dark)" />
                <span>California Geo Distribution</span>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                {geoPoints.length} Sample Points
              </span>
            </div>

            <div style={{ flex: 1, width: '100%', height: '100%' }}>
              <MapContainer
                center={[36.7783, -119.4179]}
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {geoPoints.map((p) => {
                  // Color code by price tier
                  const price = p.estimated_value;
                  const color = price > 350000 ? '#8C295F' : price > 200000 ? '#6C4EB8' : '#1E606B';

                  return (
                    <CircleMarker
                      key={p.id}
                      center={[p.latitude, p.longitude]}
                      radius={5}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.75,
                        weight: 1
                      }}
                    >
                      <Popup>
                        <div style={{ padding: '4px' }}>
                          <strong style={{ color: 'var(--color-purple-dark)' }}>{p.district_code}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.region_name}</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0' }}>
                            ${p.estimated_value?.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                            Income: ${(p.median_income * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <button
                            onClick={() => onSelectDistrict(p.id)}
                            className="brand-btn-primary"
                            style={{ width: '100%', padding: '5px 8px', fontSize: '0.75rem' }}
                          >
                            Inspect Housing Record
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
