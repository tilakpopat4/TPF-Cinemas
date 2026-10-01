# Testing Patterns

**Analysis Date:** 2026-10-01

## Test Framework

**Runner & Assertion Libraries:**
- Node.js native test runner and assertion library (`node:assert`) for backend environment and route testing.
- PostgreSQL transactional test runner via SQL Editor / psql for Row-Level Security (RLS) and stored procedure (RPC) verification.

**Run Commands:**
```bash
# Run backend webhook and environment validation tests
node tests/loop1-webhook-and-env.test.mjs

# Run monorepo typecheck validation across all workspaces
npm run typecheck:backend
npm --prefix apps/studio run build
npm --prefix apps/staff run build
npm --prefix apps/viewer run build

# Run database RLS and RPC test suite (execute within Supabase SQL Editor or psql)
# Target file: supabase/tests/loop1_rls_and_rpc_tests.sql
```

## Test File Organization

**Location:**
- Dedicated `tests/` directory for integration/contract tests (`tests/loop1-webhook-and-env.test.mjs`).
- Dedicated `supabase/tests/` directory for database RLS policies and PL/pgSQL verification (`supabase/tests/loop1_rls_and_rpc_tests.sql`).

**Naming:**
- Integration test scripts: `<feature_or_loop>.test.mjs`.
- Database verification scripts: `<feature_or_loop>_tests.sql`.

## Test Structure

### 1. Database RLS & RPC Transaction Testing Pattern

```sql
-- Pattern from supabase/tests/loop1_rls_and_rpc_tests.sql
begin;

-- 1. Setup mock identities in auth.users and public.profiles
insert into auth.users (id, email, ...) values ('22222222-...', 'filmmaker_a@test.tpf', ...);
insert into public.profiles (id, role, display_name) values ('22222222-...', 'filmmaker', 'Filmmaker Alice');

-- 2. Switch to unprivileged authenticated role with simulated JWT claims
set local role authenticated;
set local "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
set local "request.jwt.claim.role" = 'authenticated';

-- 3. Assert RLS policy enforcement (e.g., filmmaker cannot read others' drafts)
select count(*) from public.films where id = 'some-other-draft-id';

-- 4. Rollback all changes cleanly at the end
rollback;
```

### 2. Edge API & Webhook Testing Pattern

```javascript
// Pattern from tests/loop1-webhook-and-env.test.mjs
import assert from 'node:assert';
import { Hono } from 'hono';
import { webhooksRouter } from '../backend/src/routes/webhooks.ts';
import { validateEnv } from '../backend/src/env.ts';

// Assert environment fail-fast validation
assert.throws(
  () => validateEnv({ ENVIRONMENT: 'development', SUPABASE_URL: '...', SUPABASE_ANON_KEY: '...' }),
  /Missing SUPABASE_SERVICE_ROLE_KEY/
);

// Assert webhook secret validation
const app = new Hono();
app.route('/api/webhooks', webhooksRouter);
const res = await app.request('/api/webhooks/supabase', {
  method: 'POST',
  headers: { 'x-webhook-secret': 'invalid-secret', 'content-type': 'application/json' },
  body: JSON.stringify({ table: 'films', record: { status: 'published' } })
}, mockEnv, mockExecutionCtx);

assert.strictEqual(res.status, 401);
```

## Mocking

**Approach:**
- Mock execution context for Cloudflare Workers (`c.executionCtx.waitUntil`) implemented in `tests/loop1-webhook-and-env.test.mjs`.
- Mock database environment initialized with transactional rollback (`begin; ... rollback;`) to guarantee zero database pollution.

## Coverage

**Requirements:**
- Core security contracts (service role isolation, webhook secret checking, curator self-review prevention, and RLS leakage) require 100% verification before deployment.

## Test Types

**Integration & Contract Tests:**
- Validate edge middleware, environment bindings, and webhook endpoints (`tests/loop1-webhook-and-env.test.mjs`).

**Security & Database Tests:**
- Validate PostgreSQL Row-Level Security isolation across all four application roles (`supabase/tests/loop1_rls_and_rpc_tests.sql`).
- Validate RPC access controls, feedback requirement on rejections, and audit log generation.

**Static Verification:**
- TypeScript compilation checks (`tsc --noEmit`) verifying type safety across backend and portals.

---

*Testing analysis: 2026-10-01*
