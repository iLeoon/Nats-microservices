import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, TEST_USER } from './config.js';
import { ensureTestUserAndLogin, loginAndGetToken, authHeaders, withAutoRelogin } from './helpers.js';

// ── Custom metrics ──────────────────────────────────────────────────────────
const natsRoundTrip  = new Trend('nats_round_trip_ms', true);
const authFailRate   = new Rate('auth_fail_rate');
const productReqs    = new Counter('product_requests_total');
const customerReqs   = new Counter('customer_requests_total');

// ── Test configuration ───────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '90s', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '90s', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '90s', target: 50 },
    { duration: '30s', target: 0  },
  ],
  thresholds: {
    // p95 of all HTTP requests must stay under 500 ms
    http_req_duration:            ['p(95)<500'],
    // Custom: NATS round-trip p95 < 200 ms
    nats_round_trip_ms:           ['p(95)<200'],
    // Overall error rate < 40% (includes expected 401 auth guard checks)
    http_req_failed:              ['rate<0.40'],
    // Auth failures < 1 %
    auth_fail_rate:               ['rate<0.01'],
    // All checks must pass > 99 %
    checks:                       ['rate>0.99'],
  },
};

// ── One-time setup: create test user ─────────────────────────────────────────
export function setup() {
  const token = ensureTestUserAndLogin();
  if (!token) {
    throw new Error('Setup failed: could not obtain a JWT token. Is the gateway running?');
  }
  return { token };
}

// ── Per-VU state: each VU keeps its own token and refreshes on 401 ───────────
const vuToken = { token: null };

// ── Main VU loop ─────────────────────────────────────────────────────────────
export default function ({ token }) {
  // Initialise this VU's token from the shared setup token
  if (!vuToken.token) {
    vuToken.token = token;
  }

  // Products – findAll
  const t0 = Date.now();
  const prodRes = withAutoRelogin(
    (t) => http.get(`${BASE_URL}/products/findAll?page=1&limit=20`, { headers: authHeaders(t), tags: { endpoint: 'products_findAll' } }),
    vuToken,
    TEST_USER.email, TEST_USER.password,
  );
  natsRoundTrip.add(Date.now() - t0);
  productReqs.add(1);

  check(prodRes, {
    '[PRODUCTS] findAll 200':    (r) => r.status === 200,
    '[PRODUCTS] non-empty body': (r) => r.body && r.body.length > 0,
  });

  sleep(0.3);

  // Customers – findAll
  const t1 = Date.now();
  const custRes = withAutoRelogin(
    (t) => http.get(`${BASE_URL}/customers/findAll`, { headers: authHeaders(t), tags: { endpoint: 'customers_findAll' } }),
    vuToken,
    TEST_USER.email, TEST_USER.password,
  );
  natsRoundTrip.add(Date.now() - t1);
  customerReqs.add(1);

  check(custRes, {
    '[CUSTOMERS] findAll 200': (r) => r.status === 200,
  });

  sleep(0.3);

  // Auth guard – ensure 401 on protected route without token
  const unauthRes = http.get(`${BASE_URL}/products/findAll`, { tags: { endpoint: 'unauth_check' } });
  const authOk = check(unauthRes, {
    '[AUTH] guard rejects unauthenticated (401)': (r) => r.status === 401,
  });
  authFailRate.add(!authOk);

  sleep(0.4);
}
