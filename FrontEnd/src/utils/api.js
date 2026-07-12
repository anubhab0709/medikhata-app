import { getBearerToken, saveBearerToken, clearBearerToken } from './sessionAuth.js';

function normalizeApiBase(raw) {
  let base = String(raw || '/api').trim();
  if (!base) base = '/api';
  // Drop trailing slashes so `${base}/auth/login` never becomes `//auth/login`
  base = base.replace(/\/+$/, '');
  // Host-only Render/Vercel URLs must include the /api prefix
  if (/^https?:\/\//i.test(base) && !/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return base || '/api';
}

const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);
const AUTH_STATUS_KEY = 'khata_auth_status';
const REQUEST_TIMEOUT_MS = 30_000;

export const getAuthToken = () => localStorage.getItem(AUTH_STATUS_KEY) || '';
/** Marks session active. Pass JWT when available (needed on iPhone / cross-site). */
export const setAuthToken = (token) => {
  localStorage.setItem(AUTH_STATUS_KEY, 'true');
  if (token) saveBearerToken(token);
};
export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_STATUS_KEY);
  clearBearerToken();
};
export const isAuthTokenValid = () => localStorage.getItem(AUTH_STATUS_KEY) === 'true';

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/resend-otp',
]);

function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const bearer = getBearerToken();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Network error. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && !PUBLIC_AUTH_PATHS.has(path)) {
    clearAuthToken();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    try {
      const text = await response.text();
      payload = text ? { message: text } : null;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed');
    error.status = response.status;
    error.retryAfter = payload?.retryAfter;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function changePassword(currentPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ token, resetToken, newPassword, confirmPassword, email }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: resetToken || token,
      resetToken: resetToken || token,
      newPassword,
      confirmPassword,
      email,
    }),
  });
}

export const authApi = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateSettings: (body) => request('/auth/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  sendOtp: (body) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  resendOtp: (body) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword,
  resetPassword,
  changePassword,
};

export const customerApi = {
  list: () => request('/customers'),
  dashboardSummary: () => request('/customers/dashboard-summary'),
  get: (customerId) => request(`/customers/${customerId}`),
  create: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  remove: (customerId) => request(`/customers/${customerId}`, { method: 'DELETE' }),
};

export const transactionApi = {
  create: (customerId, body) => request(`/customers/${customerId}/transactions`, { method: 'POST', body: JSON.stringify(body) }),
  update: (customerId, txnId, body) => request(`/customers/${customerId}/transactions/${txnId}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (customerId, txnId) => request(`/customers/${customerId}/transactions/${txnId}`, { method: 'DELETE' }),
};

export const reminderApi = {
  markOne: (customerId) => request(`/customers/${customerId}/reminders/mark`, { method: 'POST' }),
  markBulk: (customerIds) => request('/customers/reminders/mark-bulk', { method: 'POST', body: JSON.stringify({ customerIds }) }),
};

export const supportApi = {
  sendMessage: (body) => request('/support/messages', { method: 'POST', body: JSON.stringify(body) }),
};
