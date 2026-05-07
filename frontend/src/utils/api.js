const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('medcalc_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),

  // Patients
  listPatients: (q = '') => request(`/patients?q=${encodeURIComponent(q)}`),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // History
  saveHistory: (data) => request('/history', { method: 'POST', body: JSON.stringify(data) }),
  listHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/history${qs ? '?' + qs : ''}`);
  },
  getHistory: (id) => request(`/history/${id}`),
  deleteHistory: (id) => request(`/history/${id}`, { method: 'DELETE' }),

  // Protocols
  listProtocols: () => request('/protocols'),
  getProtocolsByCalculator: (calcId) => request(`/protocols/by-calculator/${calcId}`),
  getProtocol: (id) => request(`/protocols/${id}`),
  saveProtocol: (data) => request('/protocols', { method: 'POST', body: JSON.stringify(data) }),
  updateProtocol: (id, data) => request(`/protocols/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export function setToken(token) {
  if (token) localStorage.setItem('medcalc_token', token);
  else localStorage.removeItem('medcalc_token');
}

export function getStoredToken() {
  return getToken();
}
