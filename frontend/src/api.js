const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('chip_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const errJson = await res.json();
        errMsg = errJson.detail || errMsg;
      } catch (e) {
        // use default error message
      }
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    async register(data) {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.access_token) {
        localStorage.setItem('chip_token', res.access_token);
        localStorage.setItem('chip_user', JSON.stringify(res.user));
      }
      return res;
    },
    async login(username_or_email, password) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username_or_email, password }),
      });
      if (res.access_token) {
        localStorage.setItem('chip_token', res.access_token);
        localStorage.setItem('chip_user', JSON.stringify(res.user));
      }
      return res;
    },
    async getMe() {
      return await request('/auth/me');
    },
    logout() {
      localStorage.removeItem('chip_token');
      localStorage.removeItem('chip_user');
    },
    getUser() {
      try {
        const u = localStorage.getItem('chip_user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    },
    isAuthenticated() {
      return !!localStorage.getItem('chip_token');
    },
  },

  // Housing Discovery
  housing: {
    async getRecords(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => query.append(key, v));
          } else {
            query.append(key, value);
          }
        }
      });
      return await request(`/housing?${query.toString()}`);
    },
    async getDetail(id) {
      return await request(`/housing/${id}`);
    },
    async getGeoPoints(sampleSize = 350) {
      return await request(`/housing/geo/points?sample_size=${sampleSize}`);
    },
  },

  // ML Predictions
  predictions: {
    async predict(data) {
      return await request('/predictions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async getHistory() {
      return await request('/predictions/history');
    },
    async deleteHistory(id) {
      return await request(`/predictions/history/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Market Insights
  market: {
    async getOverview() {
      return await request('/market/overview');
    },
    async getDistributions() {
      return await request('/market/distributions');
    },
    async getRegions() {
      return await request('/market/regions');
    },
  },

  // Favorites
  favorites: {
    async list(folder = null) {
      const q = folder ? `?folder=${encodeURIComponent(folder)}` : '';
      return await request(`/favorites${q}`);
    },
    async add(recordId, note = '', folder = 'Favorites') {
      return await request('/favorites', {
        method: 'POST',
        body: JSON.stringify({
          housing_record_id: recordId,
          personal_note: note,
          folder_name: folder,
        }),
      });
    },
    async remove(recordId) {
      return await request(`/favorites/${recordId}`, {
        method: 'DELETE',
      });
    },
  },

  // Saved Searches
  savedSearches: {
    async list() {
      return await request('/saved-searches');
    },
    async create(title, filterParams) {
      return await request('/saved-searches', {
        method: 'POST',
        body: JSON.stringify({ title, filter_params: filterParams }),
      });
    },
    async delete(id) {
      return await request(`/saved-searches/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Comparisons
  compare: {
    async fetchComparison(recordIds) {
      return await request('/compare', {
        method: 'POST',
        body: JSON.stringify({ record_ids: recordIds }),
      });
    },
  },

  // Affordability
  affordability: {
    async calculate(data) {
      return await request('/affordability/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // AI Assistant (Gemini)
  ai: {
    async ask(question, context) {
      return await request('/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ question, context }),
      });
    },
  },

  // Trust & Transparency
  trust: {
    async getInfo() {
      return await request('/trust/info');
    },
  },

  // Admin Portal
  admin: {
    async getOverview() {
      return await request('/admin/overview');
    },
    async getUsers() {
      return await request('/admin/users');
    },
    async toggleUserStatus(userId, active) {
      return await request(`/admin/users/${userId}/status?active=${active}`, {
        method: 'PUT',
      });
    },
    async getAuditLogs() {
      return await request('/admin/audit-logs');
    },
    async getSystemHealth() {
      return await request('/admin/system-health');
    },
  },
};
