import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import IntegrityBanner from './components/IntegrityBanner';
import AuthModal from './components/AuthModal';

import LandingPage from './pages/LandingPage';
import ExplorePage from './pages/ExplorePage';
import DetailsPage from './pages/DetailsPage';
import EstimatorPage from './pages/EstimatorPage';
import AffordabilityPage from './pages/AffordabilityPage';
import ComparePage from './pages/ComparePage';
import MarketInsightsPage from './pages/MarketInsightsPage';
import TrustPage from './pages/TrustPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import { api } from './api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [user, setUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [comparedIds, setComparedIds] = useState([]);

  // Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Load session on startup
  useEffect(() => {
    const cachedUser = api.auth.getUser();
    if (cachedUser && api.auth.isAuthenticated()) {
      setUser(cachedUser);
      loadFavorites();
    }
  }, []);

  async function loadFavorites() {
    try {
      const favs = await api.favorites.list();
      setFavoriteIds(favs.map((f) => f.housing_record_id));
    } catch {
      // not logged in or error
    }
  }

  function handleNavigate(pageId) {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectDistrict(id) {
    setSelectedDistrictId(id);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleToggleFavorite(recordId) {
    if (!user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (favoriteIds.includes(recordId)) {
      try {
        await api.favorites.remove(recordId);
        setFavoriteIds((prev) => prev.filter((id) => id !== recordId));
      } catch (err) {
        alert("Could not remove favorite: " + err.message);
      }
    } else {
      try {
        await api.favorites.add(recordId);
        setFavoriteIds((prev) => [...prev, recordId]);
      } catch (err) {
        alert("Could not save favorite: " + err.message);
      }
    }
  }

  function handleToggleCompare(recordId) {
    if (comparedIds.includes(recordId)) {
      setComparedIds((prev) => prev.filter((id) => id !== recordId));
    } else {
      if (comparedIds.length >= 6) {
        alert("You can compare a maximum of 6 districts at one time.");
        return;
      }
      setComparedIds((prev) => [...prev, recordId]);
    }
  }

  function handleRemoveFromCompare(recordId) {
    setComparedIds((prev) => prev.filter((id) => id !== recordId));
  }

  function handleClearCompare() {
    setComparedIds([]);
  }

  function handleOpenAuth(mode = 'login') {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }

  function handleAuthSuccess(loggedInUser) {
    setUser(loggedInUser);
    loadFavorites();
  }

  function handleLogout() {
    api.auth.logout();
    setUser(null);
    setFavoriteIds([]);
    if (currentPage === 'dashboard' || currentPage === 'admin') {
      setCurrentPage('landing');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <IntegrityBanner />
      
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        favoriteCount={favoriteIds.length}
        compareCount={comparedIds.length}
      />

      <main style={{ flex: 1 }}>
        {currentPage === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            onSelectDistrict={handleSelectDistrict}
            onToggleCompare={handleToggleCompare}
            comparedIds={comparedIds}
            onToggleFavorite={handleToggleFavorite}
            favoriteIds={favoriteIds}
            user={user}
          />
        )}

        {currentPage === 'detail' && (
          <DetailsPage
            districtId={selectedDistrictId}
            onBack={() => handleNavigate('explore')}
            onSelectDistrict={handleSelectDistrict}
            onToggleFavorite={handleToggleFavorite}
            favoriteIds={favoriteIds}
            onToggleCompare={handleToggleCompare}
            comparedIds={comparedIds}
          />
        )}

        {currentPage === 'estimator' && (
          <EstimatorPage user={user} />
        )}

        {currentPage === 'affordability' && (
          <AffordabilityPage />
        )}

        {currentPage === 'compare' && (
          <ComparePage
            comparedIds={comparedIds}
            onRemoveFromCompare={handleRemoveFromCompare}
            onClearCompare={handleClearCompare}
            onSelectDistrict={handleSelectDistrict}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'market' && (
          <MarketInsightsPage />
        )}

        {currentPage === 'trust' && (
          <TrustPage />
        )}

        {currentPage === 'dashboard' && (
          <UserDashboardPage
            user={user}
            onSelectDistrict={handleSelectDistrict}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage
            user={user}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
