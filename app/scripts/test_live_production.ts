/**
 * Live Production Test Suite for https://metrocardz.com
 * Executes real HTTP requests against the live production server.
 */

const BASE_URL = 'https://metrocardz.com';

interface TestResult {
  name: string;
  url: string;
  status: number;
  expectedStatus: number | number[];
  durationMs: number;
  pass: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  path: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    expectedStatus?: number | number[];
  }
) {
  const url = `${BASE_URL}${path}`;
  const method = options?.method || 'GET';
  const expectedStatus = options?.expectedStatus || 200;
  const start = Date.now();

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'MetroCardz-Production-Auditor/1.0',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      redirect: 'follow',
    };

    const res = await fetch(url, fetchOptions);
    const durationMs = Date.now() - start;

    const pass = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;

    let notes = `Status: ${res.status}`;
    try {
      const text = await res.text();
      if (res.headers.get('content-type')?.includes('application/json')) {
        const json = JSON.parse(text);
        if (json.status) notes += ` | status: ${json.status}`;
        if (json.detail) notes += ` | detail: ${json.detail}`;
      } else {
        notes += ` | size: ${text.length} bytes`;
      }
    } catch {
      // ignore
    }

    results.push({
      name,
      url,
      status: res.status,
      expectedStatus,
      durationMs,
      pass,
      notes,
    });

    const symbol = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${symbol}: [${method}] ${path} -> ${res.status} (${durationMs}ms) - ${name}`);
    if (!pass) {
      console.log(`     Details: ${notes}`);
    }
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({
      name,
      url,
      status: 0,
      expectedStatus,
      durationMs,
      pass: false,
      notes: err.message,
    });
    console.log(`  ✗ FAIL: [${method}] ${path} -> NETWORK ERROR: ${err.message} (${durationMs}ms)`);
  }
}

async function runLiveAudit() {
  console.log(`\n======================================================`);
  console.log(`🌐 LIVE PRODUCTION AUDIT: ${BASE_URL}`);
  console.log(`======================================================\n`);

  console.log(`▶ [1/4] Core Platform & API Health Checks...`);
  await testEndpoint('System Health Status', '/api/v1/health');
  await testEndpoint('Deals Health Status', '/api/health');
  await testEndpoint('Public Categories', '/api/categories');
  await testEndpoint('Public Cities', '/api/cities');
  await testEndpoint('Public Deals List', '/api/deals');
  await testEndpoint('Public Offers Catalog', '/api/v1/offers/public');

  console.log(`\n▶ [2/4] Public Pages & SSR Routes...`);
  await testEndpoint('Homepage / Landing Page', '/');
  await testEndpoint('Go NFC Deals Landing', '/go');
  await testEndpoint('Go Admin Login Page', '/go/login');
  await testEndpoint('Portal Login Page', '/login');
  await testEndpoint('Browse Offers Page', '/browse');
  await testEndpoint('Live Offers Page', '/live-offers');
  await testEndpoint('Contact Page', '/contact');
  await testEndpoint('Terms and Conditions', '/terms-and-conditions');
  await testEndpoint('Privacy Policy', '/privacy-policy');

  console.log(`\n▶ [3/4] Authenticated API Security Checks (Rejection & Isolation)...`);
  await testEndpoint(
    'Unauthorized Access to Admin Merchants',
    '/api/v1/admin/merchants',
    { expectedStatus: [401, 403] }
  );
  await testEndpoint(
    'Unauthorized Access to Admin Cards',
    '/api/v1/admin/cards',
    { expectedStatus: [401, 403] }
  );
  await testEndpoint(
    'Unauthorized Access to Merchant Profile',
    '/api/v1/merchant/profile',
    { expectedStatus: [401, 403] }
  );
  await testEndpoint(
    'Unauthorized Access to Dashboard Stats',
    '/api/v1/dashboard/stats',
    { expectedStatus: [401, 403] }
  );
  await testEndpoint(
    'Invalid Credentials Login Rejection',
    '/api/v1/auth/login-email',
    {
      method: 'POST',
      body: { email: 'invalid@metrocardz.com', password: 'wrongpassword123' },
      expectedStatus: [400, 401],
    }
  );
  await testEndpoint(
    'Invalid Phone Login Rejection',
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: { phone: '9999999999', password: 'wrongpassword123' },
      expectedStatus: [400, 401],
    }
  );

  console.log(`\n▶ [4/4] Public Lookups & Utilities...`);
  await testEndpoint(
    'Public Membership Lookup (Non-existent phone)',
    '/api/v1/public/lookup-membership',
    {
      method: 'POST',
      body: { phone: '9999999999', merchant_id: 'test' },
      expectedStatus: [200, 404],
    }
  );
  await testEndpoint(
    'Coupon Validation (Invalid coupon)',
    '/api/v1/coupons/validate',
    {
      method: 'POST',
      body: { code: 'INVALID_COUPON_CODE_123', purchase_amount: 1000 },
      expectedStatus: [200, 400, 404],
    }
  );

  console.log(`\n======================================================`);
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  console.log(`📊 LIVE AUDIT COMPLETE: ${passed}/${total} PASSED (${failed} failed)`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveAudit();
