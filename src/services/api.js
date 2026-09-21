/**
 * UniPilot API Service Client
 * Connects the React frontend to the Python FastAPI backend.
 * Falls back gracefully to optimistic updates if the backend is temporarily offline.
 */

// During development Vite proxies this path to FastAPI. Keeping the request
// same-origin prevents browser CORS/network failures on localhost or LAN URLs.
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('unipilot_token');
  const localWorkspace = localStorage.getItem('unipilot_local_mode');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Local UniPilot intentionally runs without authentication. This selects
    // the stable local SQLite workspace used by backend data and AI routes.
    ...(localWorkspace ? { 'X-UniPilot-Local': localWorkspace } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `Server returned ${res.status}. Please try again shortly.` }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[UniPilot API] Request to ${endpoint} failed, falling back:`, error.message);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Cannot reach the UniPilot server. Please refresh and try again.');
    }
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health').catch(() => ({ status: 'offline' })),

  // Attendance
  getAttendance: () => request('/attendance'),
  createSubject: (subject) =>
    request('/attendance', {
      method: 'POST',
      body: JSON.stringify(subject),
    }),
  deleteSubject: (subjectId) =>
    request(`/attendance/${subjectId}`, {
      method: 'DELETE',
    }),
  logAttendance: (subjectId, attendedDelta, heldDelta) =>
    request(`/attendance/${subjectId}/log`, {
      method: 'POST',
      body: JSON.stringify({ attended_delta: attendedDelta, held_delta: heldDelta }),
    }),
  bulkAttendance: (subjectId, status, days) =>
    request('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, status, days }),
    }),
  calculateWhatIf: (subjectId, targetPercentage) =>
    request('/attendance/calculate-whatif', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, target_percentage: targetPercentage }),
    }),

  // Activities (Unified Feed)
  getActivities: (type) => request(`/activities${type && type !== 'All' ? `?type=${type}` : ''}`),
  addActivity: (item) =>
    request('/activities', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  deleteActivity: (id) =>
    request(`/activities/${id}`, {
      method: 'DELETE',
    }),

  // Importers
  importGitHub: (username) =>
    request('/import/github', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  commitGitHubRepo: (repo) =>
    request('/import/github/commit', {
      method: 'POST',
      body: JSON.stringify(repo),
    }),
  parseCertificate: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('unipilot_token');
    const localWorkspace = localStorage.getItem('unipilot_local_mode');
    const res = await fetch(`${API_BASE}/import/certificate`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(localWorkspace ? { 'X-UniPilot-Local': localWorkspace } : {}),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Certificate extraction failed');
    return res.json();
  },
  commitCertificate: (cert) =>
    request('/import/certificate/commit', {
      method: 'POST',
      body: JSON.stringify(cert),
    }),

  chat: (message, history = []) =>
    request('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  summarizeNotes: (docId) =>
    request(`/copilot/notes/${docId}/summarize`, {
      method: 'POST',
    }),
  getFlashcards: (docId) =>
    request(`/copilot/notes/${docId}/flashcards`),
  summarizeNotesAI: (docTitle, subject) =>
    request('/copilot/notes/summarize', {
      method: 'POST',
      body: JSON.stringify({ doc_title: docTitle, subject }),
    }),
  getFlashcardsAI: (docTitle, subject, count = 5) =>
    request('/copilot/notes/flashcards', {
      method: 'POST',
      body: JSON.stringify({ doc_title: docTitle, subject, count }),
    }),
  regenerateBullet: (bullet, context = '') =>
    request('/copilot/regenerate-bullet', {
      method: 'POST',
      body: JSON.stringify({ bullet, context }),
    }),

  // Resume & Portfolio
  compileResume: () => request('/resume/compile'),
  compilePortfolio: () => request('/resume/portfolio'),

  // Auth & Profile
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  getProfile: () => request('/auth/me'),
  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Quiz Generation
  generateQuizAI: (docTitle, subject, count = 5) =>
    request('/copilot/notes/quiz', {
      method: 'POST',
      body: JSON.stringify({ doc_title: docTitle, subject, count }),
    }),

  // Admin
  adminLogin: (secret) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ secret }) }),
  adminGetStudents: (token) =>
    request(`/admin/students?admin_token=${encodeURIComponent(token)}`),
  adminGetStudentDetail: (id, token) =>
    request(`/admin/students/${id}?admin_token=${encodeURIComponent(token)}`),
  adminLogAttendance: (studentId, subjectId, attendedDelta, heldDelta, token) =>
    request(`/admin/students/${studentId}/attendance/log?admin_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, attended_delta: attendedDelta, held_delta: heldDelta }),
    }),
  adminBulkAttendance: (studentId, subjectId, status, days, token) =>
    request(`/admin/students/${studentId}/attendance/bulk?admin_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, status, days }),
    }),
  adminSetAttendance: (studentId, subjectId, attended, held, required, token) =>
    request(`/admin/students/${studentId}/attendance/set?admin_token=${encodeURIComponent(token)}`, {
      method: 'PUT',
      body: JSON.stringify({ subject_id: subjectId, attended, held, required }),
    }),
  adminCreateSubject: (studentId, subject, token) =>
    request(`/admin/students/${studentId}/attendance/subject?admin_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(subject),
    }),

  // AI Career & Portfolio Growth Advisor
  getCareerRecommendations: (profile, activities) =>
    request('/copilot/career/suggest', {
      method: 'POST',
      body: JSON.stringify({ profile, activities }),
    }),
};
