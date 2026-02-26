/**
 * SMOKE / AVAILABILITY TEST
 * ─────────────────────────
 * Hits every endpoint exactly once to verify the entire request path is alive:
 *   Client → NestJS Gateway (HTTP) → NATS → Microservice → DB
 *
 * Run:
 *   k6 run tests/k6/1_smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USER, TEST_PRODUCT, TEST_CUSTOMER } from './config.js';
import { registerUser, loginAndGetToken, authHeaders } from './helpers.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    // Every single check must pass for the test to succeed
    checks: ['rate==1.0'],
    http_req_failed: ['rate<0.2'], // allows the intentional 401 check
  },
};

export default function () {
  // ── 1. Register ────────────────────────────────────────────────────────────
  const regRes = registerUser(TEST_USER);
  check(regRes, {
    '[AUTH] register returns 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // ── 2. Login ───────────────────────────────────────────────────────────────
  const token = loginAndGetToken(TEST_USER.email, TEST_USER.password);
  check({ token }, {
    '[AUTH] login returns a token': (r) => r.token !== null && r.token !== '',
  });
  sleep(0.5);

  const headers = authHeaders(token);

  // ── 3. Products ────────────────────────────────────────────────────────────
  const createProdRes = http.post(
    `${BASE_URL}/products/create`,
    JSON.stringify(TEST_PRODUCT),
    { headers },
  );
  check(createProdRes, {
    '[PRODUCTS] create returns 200/201': (r) => r.status === 200 || r.status === 201,
  });

  const listProdRes = http.get(`${BASE_URL}/products/findAll?page=1&limit=20`, { headers });
  check(listProdRes, {
    '[PRODUCTS] findAll returns 200': (r) => r.status === 200,
    '[PRODUCTS] findAll has data array': (r) => {
      try { return Array.isArray(JSON.parse(r.body).data); } catch { return false; }
    },
  });
  sleep(0.5);

  // ── 4. Customers ───────────────────────────────────────────────────────────
  const createCustRes = http.post(
    `${BASE_URL}/customers/create`,
    JSON.stringify(TEST_CUSTOMER),
    { headers },
  );
  check(createCustRes, {
    '[CUSTOMERS] create returns 200/201': (r) => r.status === 200 || r.status === 201,
  });

  const listCustRes = http.get(`${BASE_URL}/customers/findAll`, { headers });
  check(listCustRes, {
    '[CUSTOMERS] findAll returns 200': (r) => r.status === 200,
  });

  const getCustRes = http.get(
    `${BASE_URL}/customers/${TEST_CUSTOMER.customer_id}`,
    { headers },
  );
  check(getCustRes, {
    '[CUSTOMERS] findOne returns 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // ── 5. Unauthenticated access must be rejected ─────────────────────────────
  const unauthRes = http.get(`${BASE_URL}/products/findAll`);
  check(unauthRes, {
    '[AUTH] unauthenticated request is rejected (401)': (r) => r.status === 401,
  });
}
