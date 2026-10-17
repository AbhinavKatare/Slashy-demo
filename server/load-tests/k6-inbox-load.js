import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 },  // Sustained load at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250', 'p(99)<500'], // 95% of requests must complete within 250ms
    http_req_failed: ['rate<0.01'],               // Less than 1% errors allowed
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/v1';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${__ENV.TEST_JWT || 'mock-dev-jwt'}`,
  };

  // 1. Health Liveness Probe
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Full-Text Search Query with Operators
  const searchRes = http.get(`${BASE_URL}/search?q=from:alex@example.com is:unread budget`, { headers });
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns results array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.results);
      } catch (e) {
        return false;
      }
    },
  });

  // 3. Draft List Query
  const draftsRes = http.get(`${BASE_URL}/drafts`, { headers });
  check(draftsRes, {
    'drafts status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
