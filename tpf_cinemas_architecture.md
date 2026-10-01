# TPF Cinemas: Platform Architecture

**Goal:** a premium, beginner-friendly OTT platform with the lowest possible latency and the highest possible throughput, while starting on free tiers.

**Related files:** `tpf_cinemas_schema.sql` (database, roles, privileges) and `tpf_cinemas_filmmaker_licence_v1.md` (filmmaker licence).

---

## 1. The big picture

Three web portals share one backend. Every heavy job (serving pages, streaming video, storing uploads) is pushed to a CDN or video host, so the database only handles small metadata requests.

```
 ┌────────────────┐   ┌───────────────────┐   ┌─────────────────┐
 │  Viewer site   │   │ Filmmaker studio  │   │  Staff console  │
 │ tpfcinemas.com │   │ studio.tpfcin...  │   │ staff.tpfcin... │
 │ Astro+islands  │   │   React + Vite    │   │   React + Vite  │
 └───────┬────────┘   └─────────┬─────────┘   └────────┬────────┘
         │                      │                      │
         ▼                      ▼                      ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ CLOUDFLARE EDGE                                              │
 │ CDN cache · Workers (Hono) · R2 images · signed links        │
 └───────┬──────────────────────┬──────────────────────┬────────┘
         │                      │                      │
         ▼                      ▼                      ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ SUPABASE (Mumbai, ap-south-1)                                │
 │  Auth (logins, roles) · Postgres + RLS (films, workflow) ·   │
 │  Realtime (status alerts) · Private Storage (licence PDFs)   │
 └───────┬──────────────────────┬──────────────────────┬────────┘
         │                      │                      │
         ▼                      ▼                      ▼
 ┌────────────────┐   ┌───────────────────┐   ┌─────────────────┐
 │ Video hosting  │   │      Email        │   │    Analytics    │
 │ YouTube → Mux  │   │ status alerts     │   │ site + video    │
 └────────────────┘   └───────────────────┘   └─────────────────┘
```

Players stream video **directly** from the video host's CDN. Video bytes never pass through your Workers or your database.

---

## 2. The three portals

| Portal | Address | Who uses it | Main jobs | Frontend |
|---|---|---|---|---|
| **Viewer site** | `tpfcinemas.com` | Everyone | Browse, watch, watchlist, progress, comments | Astro + React islands |
| **Filmmaker studio** | `studio.tpfcinemas.com` | Filmmakers (and admin for TPF's own films) | Upload, sign licence, submit, track status, read feedback, view stats | React + Vite SPA |
| **Staff console** | `staff.tpfcinemas.com` | Curators and admins | Review queue, verify licences, publish, moderate comments, feature, takedown, roles, audit log | React + Vite SPA |

**Why three portals, not one**
- Viewers download only the small viewer bundle, which keeps first load fast.
- Staff and studio code never ships to the public site.
- Each portal deploys independently, and each is its own security boundary.

**Why not four:** curators and admins share one console. Screens are shown or hidden by role.

**Later:** mobile apps and TV apps (Android TV, Fire TV) are extra *viewer clients* that use the same backend. No new backend is needed.

### Which role sees which portal

| Role | Viewer site | Filmmaker studio | Staff console |
|---|---|---|---|
| Viewer | ✓ | – (offer "Become a filmmaker") | – |
| Filmmaker | ✓ | ✓ | – |
| Curator | ✓ | – | ✓ (review, verify, publish, moderate) |
| Admin | ✓ | ✓ | ✓ (everything, plus feature, takedown, roles, audit) |

Portals hide screens by role for a cleaner experience, but the **database enforces the real rules** (row-level security, column grants and workflow functions in `tpf_cinemas_schema.sql`).

---

## 3. How the pieces connect

1. **One login, all portals.** Supabase Auth stores the session cookie on the parent domain (`.tpfcinemas.com`), so signing in once works on every subdomain.
2. **Direct reads and writes.** Portals use the Supabase client. Row-level security limits every query to what that user's role allows.
3. **Workflow through functions.** Status changes never happen with plain updates. They go through `submit_film`, `review_film`, `verify_licence`, `publish_film`, `feature_film`, `takedown_film` and `hide_comment`.
4. **Realtime.** The filmmaker's studio updates the moment a curator decides. The staff queue updates when a film is submitted.
5. **Edge Workers** handle what shouldn't run in a browser: signed upload URLs, video-host webhooks, cache clearing, and rate limiting.

---

## 4. Key data flows

### A. Watching a film
1. Viewer opens a prerendered catalogue page, served from the edge cache.
2. Poster and metadata load first. The player script loads only when the viewer taps **Play**.
3. The player (YouTube iframe, or Mux Player later) streams straight from the video host's CDN.
4. Watch progress is saved to `watch_history` in batches (for example every 15 to 30 seconds), not on every tick.

### B. Submitting a film
1. Filmmaker fills in details and adds credits and genres (all editable while the film is a draft).
2. Poster uploads to storage through a signed URL.
3. Video: paste a YouTube link (phase 1), or upload straight to Mux with a direct-upload URL (phase 2).
4. Filmmaker completes Schedule A and C of the licence, creating a `licence_agreements` row. The signed PDF goes to the private `licences` bucket.
5. `submit_film()` checks that video, poster and licence exist, then sets the status to `submitted`.
6. Realtime alerts the staff queue.

### C. Review and publish
1. Curator opens the queue (`status = 'submitted'`).
2. `review_film()` records the decision. Feedback is mandatory for "changes requested" or "rejected". The filmmaker sees it in the studio.
3. On approval, `verify_licence()` confirms the music-clearance declaration.
4. `publish_film()` sets the status to `published`.
5. A webhook calls a Worker, which clears the cached catalogue and triggers the filmmaker's email.

### D. Takedown
Admin calls `takedown_film()`. The film is archived and unfeatured, and the same webhook clears the cache so it disappears from the site.

---

## 5. Latency and throughput plan

### Latency
| Technique | Effect |
|---|---|
| Supabase in **Mumbai (ap-south-1)** | Shorter database round trip for Indian users. Supabase offers this region. |
| Prerender the catalogue and cache at the edge | Most page views never touch the database. |
| Clear the cache when a film is published | Freshness without hitting the database on every view. |
| One database call per page | A function or view returns all rows for a page at once, avoiding many small queries. |
| Very little JavaScript on the viewer site | Static HTML, islands only for player and watchlist. |
| Poster first, player on tap | Avoids loading a heavy player on every page. |
| Images resized at upload | Three WebP sizes on R2, served with `srcset`. |
| Adaptive streaming (HLS) | Starts at low quality and ramps up, which suits mobile data. |
| PWA app shell | Repeat visits open almost instantly. |

### Throughput ("maximum output")
| Technique | Effect |
|---|---|
| CDN serves catalogue pages and images | Traffic spikes never reach the database. |
| Video host serves all streams | Your servers carry no video load. |
| Browser uploads directly to the video host | Large files skip your servers. |
| Stateless Workers | Scale automatically with traffic. |
| Batched progress writes | Fewer database writes per viewer. |
| Indexes already in the schema | Fast queries on status, filmmaker and comments. |

### Targets to measure (not yet benchmarked)
- Largest Contentful Paint under 2.5 s on a mid-range phone over 4G.
- Under roughly 100 KB of JavaScript on the viewer homepage.
- Test on real Indian mobile networks with Lighthouse or WebPageTest before promising speed.

---

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Code layout | One monorepo (pnpm + Turborepo) | Shared design tokens, database types, API client and `VideoPlayer` component |
| Language | TypeScript everywhere | One language, database types generated from Supabase |
| Viewer site | Astro + React islands + Tailwind | Fast static pages, minimal JavaScript |
| Studio and console | React + Vite + TanStack Query + shadcn/ui + Zod | Rich forms and tables behind a login, no SEO needed |
| Edge API | Cloudflare Workers with Hono | Runs near users, tiny and fast |
| Database, auth, realtime | Supabase (Postgres, Mumbai) | Row-level security, logins and live updates in one service |
| Images | Cloudflare R2 | Free storage tier and no charge for data leaving it |
| Licence PDFs | Private Supabase Storage bucket | Access limited to owner and staff |
| Video (phase 1) | YouTube embeds | Free, and YouTube handles delivery |
| Video (phase 2) | Mux (direct upload, HLS, Mux Player) | Free plan for a small set of flagship films |
| Search | Postgres full-text search | Enough at launch. Add Typesense or Meilisearch only if it slows down |
| Email | A free-tier transactional provider (for example Resend or Brevo) | Status notifications |
| Monitoring | Cloudflare Web Analytics, Mux Data, Sentry | Site speed, playback quality and errors |
| CI/CD | GitHub Actions with Cloudflare deploys | Automatic builds |
| Payments (later) | Razorpay or similar | UPI and cards for India |

---

## 7. Environments and security

- **Two Supabase projects:** one for staging, one for production. The free plan allows two active projects.
- **Secrets:** the `service_role` key lives only in Worker or Edge Function secrets. Never put it in browser code.
- **Signed URLs** for uploads and private files, with short expiry.
- **Bucket limits:** poster and licence buckets enforce file size and file type.
- **Rate limits** on comments, submissions and sign-ups, applied in Workers.
- **Backups:** the free Supabase plan has no daily backups, so export the database weekly and back up licence PDFs elsewhere.
- **Free-project pause:** Supabase free projects pause after a week of inactivity, so keep production active with a scheduled ping until you move to a paid plan.

---

## 8. Build order

| Phase | Build | Cost |
|---|---|---|
| **1. Launch** | Viewer site, filmmaker studio with submission form, minimal staff review queue, YouTube embeds | ₹0 |
| **2. Growth** | Mux for flagship films, realtime alerts, search, PWA install, filmmaker stats | ₹0 to low |
| **3. Revenue** | Payments, Android and TV apps, paid Supabase plan with read replicas, paid video hosting | Paid |

Move to a paid Supabase plan when you need no pausing, daily backups, or more than the free storage and bandwidth.

---

## 9. Open decisions

1. **Single framework or Astro plus Vite?** The plan above uses Astro for public pages and Vite for logged-in portals. One framework (Next.js or SvelteKit) is possible but heavier on Cloudflare.
2. **Payments model:** ad revenue share, subscription, or per-film rental (affects clause 9 of the licence).
3. **YouTube embeds:** confirm with a lawyer that your setup fits YouTube's current terms before adding ads or subscriptions.
4. **Legal entity:** decide who contracts with filmmakers, and complete the bracketed fields in the licence.
5. **Video host after free limits:** compare Mux, Cloudflare Stream and Bunny Stream on price once traffic is real.

---

## 10. Next steps

1. Run `tpf_cinemas_schema.sql` in a new Supabase project (Mumbai region).
2. Have a lawyer review `tpf_cinemas_filmmaker_licence_v1.md`.
3. Scaffold the monorepo with shared packages and one starter page per portal.
4. Build the filmmaker submission flow first, because it fills the catalogue.
