# TPF Cinemas - Backend Architecture

Edge API and Database layer for **TPF Cinemas**, a beginner-friendly OTT platform optimized for maximum throughput, low latency, and zero server infrastructure overhead.

## Architecture Overview

```
                      [ Viewer / Studio / Staff Portals ]
                                      │
                         HTTPS Requests & Webhooks
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ CLOUDFLARE WORKERS (Hono)                        │
             │ - Edge API (/api/uploads, /api/webhooks, etc.)   │
             │ - Presigned Upload URLs (Posters & Licences)     │
             │ - Cloudflare Zone Cache Purging                  │
             │ - Transactional Notifications (Resend / Brevo)   │
             │ - Global Rate Limiting                           │
             └────────────────────────┬─────────────────────────┘
                                      │
                          Postgres Wire / Supabase REST
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ SUPABASE POSTGRESQL 15+ (Mumbai: ap-south-1)     │
             │ - 10 Core Tables & Row Level Security (RLS)      │
             │ - Security Definer Workflow RPC Functions        │
             │ - Realtime Broadcast Events                      │
             │ - Storage Buckets: 'posters' & 'licences'        │
             └──────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/
├── src/
│   ├── index.ts                # Main Hono application & router mounting
│   ├── env.ts                  # Zod validation for Cloudflare Worker environment variables
│   ├── middleware/
│   │   ├── auth.ts             # Supabase JWT token verification & role enforcement
│   │   ├── error-handler.ts    # Standardized JSON error response handler
│   │   └── rate-limiter.ts     # IP-based sliding window rate limiter
│   ├── routes/
│   │   ├── health.ts           # Service uptime and Supabase ping probe
│   │   ├── uploads.ts          # Poster & licence presigned upload URLs generator
│   │   ├── webhooks.ts         # Supabase database triggers & Mux video webhooks
│   │   ├── cache.ts            # Cloudflare CDN cache invalidation endpoint
│   │   └── films.ts            # High-performance aggregated edge queries
│   ├── services/
│   │   ├── supabase.ts         # Admin (service_role) & scoped user Supabase clients
│   │   ├── cloudflare-cache.ts # Cloudflare Zone purge API client
│   │   └── email.ts            # Transactional status alerts & templates
│   └── types/
│       ├── database.ts         # TypeScript schema mirroring tpf_cinemas_schema.sql
│       └── api.ts              # API DTOs and webhook payload models
├── wrangler.jsonc              # Cloudflare Workers configuration
├── tsconfig.json               # Strict TypeScript configuration
├── package.json                # Dependencies and scripts
└── .env.example                # Documented secrets and environment variables
```

## API Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | System status and database connectivity check |
| `GET` | `/api/films/catalogue` | Public (Cached) | Fetch featured hero film, published films list, and genres |
| `GET` | `/api/films/:slug` | Public (Cached) | Fetch full film details, credits, and genres |
| `POST` | `/api/uploads/poster-url` | Filmmaker / Admin | Generate signed upload URL for film poster (max 5 MB) |
| `POST` | `/api/uploads/licence-url` | Filmmaker / Admin | Generate signed upload URL for private licence agreement (max 10 MB) |
| `POST` | `/api/webhooks/supabase` | Webhook Secret | Triggers cache purge on publish/takedown, and sends status emails |
| `POST` | `/api/webhooks/mux` | Webhook Secret | Handles video encoding ready events (Phase 2) |
| `POST` | `/api/cache/purge` | Admin only | Manually purges Cloudflare CDN edge cache |

## Getting Started

### 1. Database Setup
1. Create a project in [Supabase](https://supabase.com) in region **Mumbai (`ap-south-1`)**.
2. Run `supabase/migrations/20260920000001_init_schema.sql` in the Supabase SQL Editor.
3. Run `supabase/seed.sql` to populate initial genres.

### 2. Environment Configuration
Copy `.env.example` to `.dev.vars` inside `backend/`:
```bash
cp .env.example .dev.vars
```
Fill in your Supabase project URL, Anon Key, and Service Role Key.

### 3. Local Development
```bash
cd backend
npm install
npm run dev
```

### 4. Deploying to Cloudflare Workers
```bash
npm run deploy
```
Set secrets on Cloudflare Workers:
```bash
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_ZONE_ID
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put WEBHOOK_SECRET
```
