const API = '/api';

function getToken() {
  return localStorage.getItem('vw_token');
}

function setToken(token) {
  if (token) localStorage.setItem('vw_token', token);
  else localStorage.removeItem('vw_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),
  catalog: () => request('/catalog'),
  analyze: (devices, appliedRecoIds = []) =>
    request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ devices, applied_reco_ids: appliedRecoIds }),
    }),
  listProfiles: () => request('/profiles'),
  saveProfile: (data) =>
    request('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id, data) =>
    request(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  register: (email, password, name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),
  setToken,
  getToken,
};
