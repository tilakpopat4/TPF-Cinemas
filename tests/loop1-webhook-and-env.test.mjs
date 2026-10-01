import assert from 'node:assert';
import { EnvSchema, validateEnv } from '../backend/src/env.ts';
import { Hono } from 'hono';
import { webhooksRouter } from '../backend/src/routes/webhooks.ts';

console.log('====================================================');
console.log('🧪 RUNNING LOOP 1 BACKEND & WEBHOOK VERIFICATION');
console.log('====================================================\n');

// 1. Service Role Key hardening test: Must fail loudly if missing (no fallback)
console.log('TEST 1: Service role key missing -> fails loudly without fallback');
assert.throws(
  () => {
    validateEnv({
      ENVIRONMENT: 'development',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      WEBHOOK_SECRET: 'test-webhook-secret',
      // SUPABASE_SERVICE_ROLE_KEY omitted
    });
  },
  /Missing SUPABASE_SERVICE_ROLE_KEY/,
  'Expected validateEnv to throw when SUPABASE_SERVICE_ROLE_KEY is omitted'
);
console.log('✅ PASS: Service role key does not fall back to anon key and throws on startup.\n');

// 2. Webhook Secret requirement test: Must fail loudly if missing
console.log('TEST 2: Webhook secret missing -> fails loudly at startup');
assert.throws(
  () => {
    validateEnv({
      ENVIRONMENT: 'development',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      // WEBHOOK_SECRET omitted
    });
  },
  /Missing WEBHOOK_SECRET/,
  'Expected validateEnv to throw when WEBHOOK_SECRET is omitted'
);
console.log('✅ PASS: Webhook secret is required and throws on startup if missing.\n');

// Set up app for route testing
const mockEnv = {
  ENVIRONMENT: 'development',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  WEBHOOK_SECRET: 'super-secure-webhook-secret-12345',
  EMAIL_FROM: 'TPF Cinemas <test@tpfcinemas.com>',
};

const app = new Hono();
app.route('/api/webhooks', webhooksRouter);

const mockExecutionCtx = {
  waitUntil: (promise) => {
    promise.catch(() => {});
  },
  passThroughOnException: () => {},
};

function makeRequest(path, init) {
  return app.request(path, init, mockEnv, mockExecutionCtx);
}

// 3. Webhook with NO secret header -> 401
console.log('TEST 3: Webhook with NO x-webhook-secret header');
{
  const res = await makeRequest('/api/webhooks/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'films', record: {} }),
  });
  console.log(`Status: ${res.status}`);
  const json = await res.json();
  console.log('Response:', JSON.stringify(json));
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.error?.code, 'UNAUTHORIZED');
  console.log('✅ PASS: Missing webhook secret gets 401.\n');
}

// 4. Webhook with WRONG secret header -> 401
console.log('TEST 4: Webhook with WRONG x-webhook-secret header');
{
  const res = await makeRequest('/api/webhooks/supabase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'wrong-secret-value-here',
    },
    body: JSON.stringify({ table: 'films', record: {} }),
  });
  console.log(`Status: ${res.status}`);
  const json = await res.json();
  console.log('Response:', JSON.stringify(json));
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.error?.code, 'UNAUTHORIZED');
  console.log('✅ PASS: Wrong webhook secret gets 401.\n');
}

// 5. Webhook with VALID secret header -> passes auth
console.log('TEST 5: Webhook with VALID x-webhook-secret header');
{
  const res = await makeRequest('/api/webhooks/supabase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': mockEnv.WEBHOOK_SECRET,
    },
    body: JSON.stringify({ table: 'unknown_table', record: {} }),
  });
  console.log(`Status: ${res.status}`);
  const json = await res.json();
  console.log('Response:', JSON.stringify(json));
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  console.log('✅ PASS: Valid webhook secret authenticates successfully.\n');
}

// 6. Webhook for MUX -> 501 Not Implemented
console.log('TEST 6: POST /api/webhooks/mux returns 501 Not Implemented');
{
  const res = await makeRequest('/api/webhooks/mux', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'video.asset.ready' }),
  });
  console.log(`Status: ${res.status}`);
  const json = await res.json();
  console.log('Response:', JSON.stringify(json));
  assert.strictEqual(res.status, 501);
  assert.strictEqual(json.error, 'Not Implemented');
  console.log('✅ PASS: Mux webhook returns 501 Not Implemented.\n');
}

console.log('====================================================');
console.log('🎉 ALL BACKEND & WEBHOOK AUTOMATED TESTS PASSED');
console.log('====================================================');
