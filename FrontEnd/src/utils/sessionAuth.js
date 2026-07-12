/** Cross-site session helper (iOS Safari blocks 3rd-party cookies). Optional — cookie auth still works. */

const BEARER_KEY = 'khata_auth_token';

export function getBearerToken() {
  try {
    return localStorage.getItem(BEARER_KEY) || '';
  } catch {
    return '';
  }
}

export function saveBearerToken(token) {
  if (!token || typeof token !== 'string') return;
  try {
    localStorage.setItem(BEARER_KEY, token);
  } catch {
    // ignore quota / private mode
  }
}

export function clearBearerToken() {
  try {
    localStorage.removeItem(BEARER_KEY);
  } catch {
    // ignore
  }
}
