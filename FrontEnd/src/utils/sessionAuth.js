/** Persistent auth for Safari / iPhone (cookies alone are unreliable cross-site). */

const BEARER_KEY = 'khata_auth_token';
const AUTH_STATUS_KEY = 'khata_auth_status';

function safeGet(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getBearerToken() {
  return safeGet(BEARER_KEY);
}

export function saveBearerToken(token) {
  if (!token || typeof token !== 'string') return false;
  return safeSet(BEARER_KEY, token);
}

export function clearBearerToken() {
  safeRemove(BEARER_KEY);
}

/** Decode JWT exp without verifying signature (client-side session gate only). */
export function isJwtExpired(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return true;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    if (!payload?.exp) return false;
    // 60s skew
    return payload.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}

export function markAuthActive() {
  safeSet(AUTH_STATUS_KEY, 'true');
}

export function clearAuthFlag() {
  safeRemove(AUTH_STATUS_KEY);
}

/**
 * Prefer JWT in localStorage — required on iPhone Safari when API is another origin.
 * Falls back to auth flag for same-origin cookie sessions.
 */
export function hasUsableSession() {
  const bearer = getBearerToken();
  if (bearer) {
    if (isJwtExpired(bearer)) {
      clearBearerToken();
      clearAuthFlag();
      return false;
    }
    markAuthActive();
    return true;
  }
  return safeGet(AUTH_STATUS_KEY) === 'true';
}
