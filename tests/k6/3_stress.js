/**
 * STRESS TEST
 * ───────────
 * Pushes the system beyond its expected capacity to find the breaking point.
 * Ramps VUs aggressively; thresholds are intentionally loose so k6 records
 * the point at which the system starts degrading rather than aborting early.
 *
 * Watch for:
 *   - http_req_duration p(95) crossing 1 s  → gateway/NATS saturated
 *   - http_req_failed rate rising            → NATS queue drops or service crashes
 *   - nats_round_trip p(99) > 500 ms         → microservice back-pressure
 *
 * Stages:
 *   0:00 – 1:00  ramp  0  → 100 VUs
 *   1:00 – 3:00  hold  100 VUs
 *   3:00 – 4:00  ramp  100 → 200 VUs
 *   4:00 – 6:00  hold  200 VUs
 *   6:00 – 7:00  ramp  200 → 0  VUs  (cool-down)
 *
 * Run:
 *   k6 run tests/k6/3_stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, TEST_USER, TEST_PRODUCT } from './config.js';
import { ensureTestUserAndLogin, authHeaders, withAutoRelogin } from './helpers.js';

const natsRoundTrip = new Trend('nats_round_trip_ms', true);
const errorRate     = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '1m',  target: 100 },
    { duration: '2m',  target: 100 },
    { duration: '1m',  target: 200 },
    { duration: '2m',  target: 200 },
    { duration: '1m',  target: 0   },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    nats_round_trip_ms: ['p(95)<1000'],
    http_req_failed: ['rate<0.10'],
    error_rate:      ['rate<0.10'],
  },
};

export function setup() {
  const token = ensureTestUserAndLogin();
  if (!token) {
    throw new Error('Setup failed: could not obtain JWT. Is the gateway running?');
  }
  return { token };
}

// Per-VU mutable token state
const vuToken = { token: null };

export default function ({ token }) {
  if (!vuToken.token) {
    vuToken.token = token;
  }

  const scenario = __VU % 3;

  if (scenario === 0) {
    const t = Date.now();
    const res = withAutoRelogin(
      (tk) => http.get(`${BASE_URL}/products/findAll?page=1&limit=20`, { headers: authHeaders(tk) }),
      vuToken, TEST_USER.email, TEST_USER.password,
    );
    natsRoundTrip.add(Date.now() - t);
    errorRate.add(!check(res, { '[STRESS] products findAll 200': (r) => r.status === 200 }));

  } else if (scenario === 1) {
    const t = Date.now();
    const res = withAutoRelogin(
      (tk) => http.get(`${BASE_URL}/customers/findAll`, { headers: authHeaders(tk) }),
      vuToken, TEST_USER.email, TEST_USER.password,
    );
    natsRoundTrip.add(Date.now() - t);
    errorRate.add(!check(res, { '[STRESS] customers findAll 200': (r) => r.status === 200 }));

  } else {
    const uniqueProduct = {
      ...TEST_PRODUCT,
      product_name: `Stress Product VU${__VU} iter${__ITER}`,
    };
    const t = Date.now();
    const res = withAutoRelogin(
      (tk) => http.post(`${BASE_URL}/products/create`, JSON.stringify(uniqueProduct), { headers: authHeaders(tk) }),
      vuToken, TEST_USER.email, TEST_USER.password,
    );
    natsRoundTrip.add(Date.now() - t);
    errorRate.add(!check(res, { '[STRESS] product create 200/201': (r) => r.status === 200 || r.status === 201 }));
  }

  sleep(0.1);
}
