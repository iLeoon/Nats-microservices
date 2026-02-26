import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, TEST_USER } from './config.js';

/**
 * Register a user and return the response.
 */
export function registerUser(payload) {
  return http.post(`${BASE_URL}/auth/register`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Login and return the JWT token string (or null on failure).
 */
export function loginAndGetToken(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const ok = check(res, {
    'login succeeded (200)': (r) => r.status === 200,
  });

  if (!ok) return null;

  // The gateway sends the JWT directly in the body
  try {
    const body = JSON.parse(res.body);
    return typeof body === 'string' ? body : body.token || body.access_token || null;
  } catch {
    // Raw string token
    return res.body || null;
  }
}

/**
 * Build auth headers from a JWT token.
 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Ensure at least one test account exists and return its token.
 * Call this once in setup().
 */
export function ensureTestUserAndLogin() {
  registerUser(TEST_USER); // idempotent – ignored if already exists
  return loginAndGetToken(TEST_USER.email, TEST_USER.password);
}

/**
 * Wraps an HTTP call so that a 401 response triggers a fresh login and
 * one automatic retry.  Returns the final response.
 *
 * @param {Function} requestFn  - () => http.get/post/... result
 * @param {Object}   tokenState - mutable object with a `token` property owned by the VU
 * @param {string}   email
 * @param {string}   password
 */
export function withAutoRelogin(requestFn, tokenState, email, password) {
  let res = requestFn(tokenState.token);

  if (res.status === 401) {
    // Token expired or invalid – re-login and retry once
    const newToken = loginAndGetToken(email, password);
    if (newToken) {
      tokenState.token = newToken;
      res = requestFn(tokenState.token);
    }
  }

  return res;
}

