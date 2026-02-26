import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, TEST_USER } from './config.js';
import { ensureTestUserAndLogin, authHeaders, withAutoRelogin } from './helpers.js';

const responseTime = new Trend('response_time_ms', true);
const errorRate    = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '2m',  target: 20 },
    { duration: '30m', target: 20 },
    { duration: '2m',  target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    response_time_ms:  ['p(95)<600'],
    http_req_failed:   ['rate<0.01'],
    error_rate:        ['rate<0.01'],
    checks:            ['rate>0.99'],
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

  const endpoints = [
    `${BASE_URL}/products/findAll`,
    `${BASE_URL}/customers/findAll`,
  ];
  const url = endpoints[__ITER % 2];

  const t = Date.now();
  const res = withAutoRelogin(
    (tk) => http.get(url, { headers: authHeaders(tk) }),
    vuToken,
    TEST_USER.email, TEST_USER.password,
  );
  responseTime.add(Date.now() - t);

  const ok = check(res, {
    '[SOAK] status 200':     (r) => r.status === 200,
    '[SOAK] non-empty body': (r) => r.body && r.body.length > 2,
    '[SOAK] response < 1s':  (r) => r.timings.duration < 1000,
  });
  errorRate.add(!ok);

  sleep(1);
}
