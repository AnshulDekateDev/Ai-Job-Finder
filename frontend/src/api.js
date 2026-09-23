import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
  me: () => api.get('/auth/me'),
};

export const integrationApi = {
  getAiProviders: () => api.get('/integrations/ai'),
  saveAiProvider: (data) => api.post('/integrations/ai', data),
  testAiProvider: (id, rawKey) => api.post(`/integrations/ai/${id}/test`, { apiKey: rawKey }),
  deleteAiProvider: (id) => api.delete(`/integrations/ai/${id}`),

  getScrapers: () => api.get('/integrations/scrapers'),
  saveScraper: (data) => api.post('/integrations/scrapers', data),
  testScraper: (id, rawKey) => api.post(`/integrations/scrapers/${id}/test`, { apiKey: rawKey }),
  deleteScraper: (id) => api.delete(`/integrations/scrapers/${id}`),
};

export const jobSourceApi = {
  getSources: () => api.get('/job-sources'),
  saveSource: (data) => api.post('/job-sources', data),
  toggleSource: (id) => api.patch(`/job-sources/${id}/toggle`),
  testSource: (id) => api.post(`/job-sources/${id}/test`),
  deleteSource: (id) => api.delete(`/job-sources/${id}`),
};

export const resumeApi = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  reparse: () => api.post('/resume/reparse'),
  getProfile: () => api.get('/resume/profile'),
  updateProfile: (data) => api.put('/resume/profile', data),
};

export const jobApi = {
  search: (query) => api.post('/jobs/search', query),
  getJob: (id) => api.get(`/jobs/${id}`),
  generateCoverLetter: (id) => api.post(`/jobs/${id}/cover-letter`),
  updateCoverLetter: (id, content) => api.put(`/jobs/cover-letters/${id}`, { content }),
  toggleSave: (id, notes) => api.post(`/jobs/${id}/save`, { notes }),
  getSavedJobs: () => api.get('/jobs/saved'),
};

export const applicationApi = {
  getApplications: () => api.get('/applications'),
  recordApplication: (jobId, status, notes) => api.post(`/applications/jobs/${jobId}/apply`, { status, notes }),
};

export const preferenceApi = {
  getPreferences: () => api.get('/search-preferences'),
  updatePreferences: (data) => api.put('/search-preferences', data),
};

export default api;
