---
title: "EMS Phase 2.0 — Technical Architecture & Engineering Documentation"
subtitle: "As-built reference generated from the source tree"
author: "Engineering"
date: "2026-11-16"
---

# 1. Document Scope

This document describes **what is actually implemented** in the `ems-phase-2.0`
repository as of branch `feat/worker-scaling` (commit `c3da456`). It is an
as-built reference, not a design proposal.

The repository also contains forward-looking planning documents
(`docs/functional-requirements.md`, `docs/novelty-ems-phase1-feature-roadmap.md`,
`docs/phase-1-technology-architecture.md`, `docs/ai-feature.md`). Those describe
**intended** capabilities — multi-tenancy, RBAC, attendance, leave, payroll
integrations — that are **not present in code today**. Nothing from those
documents is treated as implemented here. Where a planned capability is absent,
it is recorded in [Section 9, Production Readiness Gaps](#9-production-readiness-gaps).

| | |
|---|---|
| Repository | `ems-phase-2.0` |
| Branch documented | `feat/worker-scaling` |
| HEAD commit | `c3da456` ("worker-scaling") |
| Workspace type | Turborepo + pnpm workspaces |
| Package manager | `pnpm@9.0.0` |
| Node engine | `>=18` (Docker images use `node:22-alpine`) |

---

# 2. System Overview & Tech Stack

## 2.1 What the system does today

Three capabilities are wired end-to-end:

1. **User registration** — a Next.js signup form calls a tRPC mutation, which
   hashes the password, inserts a `users` row, signs a JWT and sets it as an
   HTTP-only cookie.
2. **Asynchronous report generation** — an HTTP request inserts a `reports` row
   with status `queued`, enqueues a BullMQ job on Redis, and returns
   immediately. A separate worker process generates a CSV on disk and flips the
   row to `ready`. Clients poll for status and then download the file.
3. **A demo job queue** — a minimal echo queue used to exercise and demonstrate
   the BullMQ/Redis wiring (`demo` queue, `ping` job).

Everything else in the product vision (tenants, employees, attendance, leave,
approvals, notifications) exists only as **empty placeholder directories** under
`apps/web/features/*` — each contains nothing but a `.gitkeep`.

## 2.2 Monorepo layout

```text
ems-phase-2.0/
├── apps/
│   ├── api/                     @repo/api     — Express 5 HTTP server
│   │   └── src/
│   │       ├── index.ts         — node:http bootstrap, PORT binding
│   │       ├── server.ts        — Express app, middleware, route mounting
│   │       ├── queue-dashboard.ts — Bull Board mount (non-prod only)
│   │       └── env.ts           — zod-validated env for the API
│   └── web/                     web           — Next.js 16 App Router client
│       ├── app/                 — layout, page, /signup
│       ├── components/ui/       — shadcn/ui primitives (Radix-based)
│       ├── features/            — 22 EMPTY placeholder dirs (.gitkeep only)
│       ├── hooks/api/auth.ts    — useSignup() wrapper over tRPC
│       ├── trpc/                — typed client factories
│       └── env.js               — @t3-oss/env-nextjs validation
├── packages/
│   ├── database/                @repo/database — Drizzle ORM + node-postgres
│   │   ├── models/{user,report}.ts
│   │   ├── schema.ts            — re-exports all models
│   │   ├── drizzle/             — 3 generated SQL migrations + snapshots
│   │   └── drizzle.config.ts
│   ├── jobs/                    @repo/jobs     — BullMQ queues and workers
│   │   ├── connection.ts        — REDIS_URL -> ConnectionOptions
│   │   ├── demo/{job,queue,worker}.ts
│   │   ├── reports/{job,queue,worker,service}.ts
│   │   ├── worker.ts            — runs BOTH workers in one process
│   │   └── workers/reports.ts   — runs ONLY the report worker
│   ├── trpc/                    @repo/trpc     — router definitions
│   │   ├── server/routes/{health,auth,jobs,reports}/
│   │   ├── server/utils/{cookie,path-generator}.ts
│   │   └── server/{trpc,context,schema,index}.ts
│   ├── services/                @repo/services — UserService (auth logic)
│   ├── logger/                  @repo/logger   — winston singleton
│   ├── eslint-config/           @repo/eslint-config
│   └── typescript-config/       @repo/typescript-config
├── docker-compose.yml           — postgres:15, redis:7-alpine, reports-worker
├── Dockerfile.jobs              — worker image
├── turbo.json                   — build/dev/lint/db task graph
└── local-reports/               — generated CSV artifacts (git-ignored)
```

Shared packages are **consumed as raw TypeScript source**. None of
`@repo/database`, `@repo/jobs`, `@repo/trpc`, `@repo/services` or `@repo/logger`
declares `main`, `types` or `exports` in its `package.json`, and none has a
build step. They are transpiled in place by `tsx` (dev), `tsup` (API build) or
the Next.js compiler (web).

## 2.3 Tech stack

| Layer | Technology | Version | Where |
|---|---|---|---|
| Monorepo orchestration | Turborepo | `^2.7.2` | root |
| Package manager | pnpm workspaces | `9.0.0` | `pnpm-workspace.yaml` |
| Language | TypeScript | `5.9.2` / `^5.9.3` | all packages |
| HTTP server | Express | `^5.2.1` | `apps/api` |
| RPC layer | tRPC server/client | `^11.8.1` | `@repo/trpc` |
| REST + OpenAPI bridge | `trpc-to-openapi` | `^3.1.0` | `apps/api`, `@repo/trpc` |
| API reference UI | `@scalar/express-api-reference` | `^0.8.30` | `apps/api` at `/docs` |
| Queue dashboard | `@bull-board/api` + `/express` | `^9.10.5` | `apps/api` at `/queues` |
| Frontend framework | Next.js (App Router) | `16.1.0` | `apps/web` |
| UI runtime | React / React DOM | `^19.2.0` | `apps/web` |
| Data fetching | TanStack Query + `@trpc/react-query` | `^5.90.16` / `^11.8.1` | `apps/web` |
| Styling | Tailwind CSS | `^4.1.18` | `apps/web` |
| Component library | shadcn/ui over Radix UI primitives | `radix-ui ^1.8.1` | `apps/web/components/ui` |
| Forms | react-hook-form + `@hookform/resolvers` | `^7.70.0` | `apps/web` |
| Charts (installed, unused) | Recharts | `2.15.4` | `apps/web` |
| ORM | Drizzle ORM | `^0.45.1` | `@repo/database` |
| Migration tool | drizzle-kit | `^0.31.8` | `@repo/database` |
| Database driver | `pg` (node-postgres) | `^8.16.3` | `@repo/database` |
| Database | PostgreSQL | `15` (compose image) | `docker-compose.yml` |
| Queue / broker | BullMQ over Redis | `^5.63.0` / `redis:7-alpine` | `@repo/jobs` |
| Validation | Zod | `^4.3.5` | everywhere |
| Auth tokens | `jsonwebtoken` | `^9.0.3` | `@repo/services` |
| Cookies | `cookie-parser` | `^1.4.7` | `apps/api` |
| Logging | winston | `^3.19.0` | `@repo/logger` |
| API bundler | tsup (+ `@swc/core`) | `^8.5.1` | `apps/api` |
| Dev runner | tsx | `^4.21.0` | api, jobs, database |
| Env loading | `dotenv` / `dotenv-cli` / `@t3-oss/env-nextjs` | — | all |

## 2.4 External integrations

The only external systems the running code talks to are **PostgreSQL** and
**Redis**. There are no outbound HTTP integrations, no email provider, no
object storage, and no payment provider in the codebase.

`google-auth-library@^10.5.0` is declared as a dependency of `@repo/services`
but is **never imported** anywhere in the source — Google OAuth is not
implemented.

---

# 3. System Architecture

## 3.1 Processes

The system runs as three or four independent processes:

| Process | Entry point | Default port | Purpose |
|---|---|---|---|
| Web client | `apps/web` (`next dev --port 3000`) | 3000 | Next.js App Router UI |
| API server | `apps/api/src/index.ts` | `PORT` env, falls back to `8000` (local `.env` sets `3001`) | Express + tRPC + REST + docs + dashboard |
| Combined worker | `packages/jobs/worker.ts` | — | Runs **both** demo and report workers |
| Report-only worker | `packages/jobs/workers/reports.ts` | — | Runs **only** the report worker; horizontally scalable |

The API server and workers share no memory. They coordinate exclusively through
Redis (job state) and PostgreSQL (report rows).

## 3.2 Request and job flow

```mermaid
flowchart TB
    subgraph client["Client tier — apps/web :3000"]
        Browser["Next.js 16 App Router<br/>React 19 · shadcn/ui · Tailwind 4"]
        TQ["@trpc/react-query client<br/>fetch credentials: include"]
        Browser --> TQ
    end

    subgraph api["API process — apps/api :3001 (Express 5)"]
        MW["Middleware pipeline, in order:<br/>1 · cors origin localhost:3000 — NON-PROD ONLY<br/>2 · express.json<br/>3 · cookieParser"]
        Plain["Plain Express routes<br/>GET / · GET /health<br/>GET /reports/:reportId/download<br/>GET /openapi.json · GET /docs (Scalar)<br/>GET /queues (Bull Board) — NON-PROD ONLY"]
        REST["/api/* — createOpenApiExpressMiddleware<br/>REST projection of the tRPC router"]
        TRPC["/trpc/* — trpcExpress adapter"]
        Ctx["createContext — cookie helpers only<br/>NO token verification, NO user on ctx"]
        MW --> Plain
        MW --> REST
        MW --> TRPC
        REST -.-> Ctx
        TRPC -.-> Ctx
    end

    subgraph routers["@repo/trpc — serverRouter · every procedure is publicProcedure"]
        R1["health.getHealth"]
        R2["authRouter.<br/>createUserWithEmailAndPassword"]
        R3["jobs.enqueueDemo<br/>jobs.getDemo"]
        R4["reports.create<br/>reports.get"]
    end

    subgraph svc["Domain layer"]
        US["@repo/services · UserService<br/>HMAC-SHA256 hash · JWT sign/verify"]
        RS["@repo/jobs/reports/service.ts<br/>createDemoReport · getReport<br/>generateReport · getReportDownload"]
    end

    subgraph infra["Stateful infrastructure"]
        PG[("PostgreSQL 15<br/>users · reports")]
        RD[("Redis 7<br/>queues: demo · report-generation")]
        FS["Host filesystem<br/>./local-reports/*.csv"]
    end

    subgraph workers["Worker process(es) — @repo/jobs, scaled independently"]
        DW["demo worker<br/>concurrency 1 (default)"]
        RW["report worker<br/>concurrency 2 · attempts 3<br/>exponential backoff from 1s"]
    end

    TQ -->|"HTTP /trpc/*"| MW
    REST --> routers
    TRPC --> routers
    Plain -->|"res.sendFile"| FS
    R2 --> US
    R4 --> RS
    R3 -->|"queue.add('ping')"| RD
    R4 -->|"queue.add('generate')<br/>jobId report-&lt;uuid&gt;"| RD
    US -->|"drizzle insert / select"| PG
    RS -->|"drizzle insert / select / update"| PG
    RD -->|"blocking pop"| DW
    RD -->|"blocking pop"| RW
    RW -->|"status queued → processing → ready"| PG
    RW -->|"writeFile CSV"| FS
    Plain -.->|"read-only queue inspection"| RD
```

## 3.3 Report generation sequence

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant A as API (Express + tRPC)
    participant DB as PostgreSQL
    participant Q as Redis / BullMQ
    participant W as Report worker
    participant FS as local-reports/

    C->>A: POST /api/reports {"reportType":"user-summary"}
    A->>DB: INSERT reports (report_type, status='queued')
    DB-->>A: {id}
    A->>Q: reportQueue.add('generate', {reportId}, jobId="report-<id>")
    Q-->>A: {jobId}
    A-->>C: 200 {reportId, jobId, status:"queued"}

    Q->>W: deliver job (concurrency 2)
    W->>DB: UPDATE reports SET status='processing', started_at=now()
    W->>DB: SELECT count(*) FROM users
    DB-->>W: totalUsers
    W->>FS: writeFile user-summary-<id>.csv
    W->>DB: UPDATE reports SET status='ready', storage_key,<br/>file_name, file_size_bytes, completed_at

    loop poll until terminal
        C->>A: GET /api/reports/{reportId}
        A->>DB: SELECT * FROM reports WHERE id=...
        A-->>C: {status, downloadPath|null, ...}
    end

    C->>A: GET /reports/{reportId}/download
    A->>DB: getReportDownload — requires status='ready'
    A->>FS: res.sendFile(local-reports/<storage_key>)
    A-->>C: 200 text/csv (Content-Disposition: attachment)

    alt job throws
        W->>Q: retry (attempts 3, exponential backoff from 1s)
        Note over W,DB: on final attempt only:<br/>UPDATE reports SET status='failed',<br/>failure_message='Generation failed. Retry the report.'
    end
```

## 3.4 Middleware order in `apps/api/src/server.ts`

Order matters and is fixed in code:

1. `cors({ origin: "http://localhost:3000", credentials: true })` — **mounted
   only when `NODE_ENV !== "prod"`**. In production no CORS headers are emitted
   at all.
2. `express.json()`
3. `cookieParser()`
4. `GET /` → `{ message: "EMS is up and running..." }`
5. `GET /health` → `{ message, healthy: true }` (plain Express, distinct from
   the tRPC health procedure)
6. `GET /reports/:reportId/download`
7. `GET /openapi.json`
8. `app.use("/docs", apiReference({ url: "/openapi.json" }))`
9. `mountQueueDashboard(app)` at `/queues` — **only when `NODE_ENV !== "prod"`**
10. `app.use("/api", createOpenApiExpressMiddleware(...))` — REST projection
11. `app.use("/trpc", trpcExpress.createExpressMiddleware(...))` — native tRPC

There is **no error-handling middleware** (`(err, req, res, next)`) and **no
404 handler**. The download route forwards errors to `next()`, which falls
through to Express 5's default handler.

---

# 4. Multi-Tenancy & Security Model

## 4.1 Multi-tenancy: not implemented

**There is no multi-tenancy in the codebase.** This is stated plainly because
the planning documents describe a tenant model that does not exist in code:

- No `tenants`, `organizations`, `memberships` or equivalent table exists in
  `packages/database/models/` or in any of the three migrations.
- Neither `users` nor `reports` carries a `tenant_id`, `org_id` or any
  discriminator column.
- No query in `@repo/services` or `@repo/jobs` filters by a tenant scope. The
  report generator runs `SELECT count(*) FROM users` across the **entire**
  table.
- There is no subdomain, header or path-based tenant resolution middleware.
- `apps/web/features/tenant/` and `apps/web/features/organization/` contain
  only `.gitkeep`.

Any tenant isolation must be designed and added; nothing in the current data
model constrains cross-tenant reads.

## 4.2 Authentication: signup only

| Aspect | Implementation | Location |
|---|---|---|
| Registration | `createUserWithEmailAndPassword` | `packages/services/user/index.ts` |
| Duplicate check | `SELECT ... WHERE email = ?`, throws if found | same |
| Salt | `randomBytes(16).toString("hex")`, stored per user in `users.salt` | same |
| Password hash | `createHmac("sha256", salt).update(password).digest("hex")` | same |
| Token | `JWT.sign({ id }, env.JWT_SECRET)` — HS256 default, **no `expiresIn`** | same |
| Token delivery | HTTP-only cookie `authentication-token` | `packages/trpc/server/utils/cookie.ts` |
| Cookie options | `path:"/"`, `httpOnly:true`, `secure:false`, `sameSite:"strict"`, `maxAge: 1 year` | same |
| Sign-in | `signInUserWithEmailAndPassword` **exists in the service but is not exposed by any route** | `packages/services/user/index.ts` |
| Token verification | `verifyAndDecodeUserToken` **exists but is never called** | same |
| Logout | `clearAuthenticationCookie` **exists but is never called** | `utils/cookie.ts` |

The password field is a **keyed HMAC-SHA256 digest, not a password-hashing
KDF**. It is a single fast hash iteration with no work factor — bcrypt, scrypt
or Argon2 is the appropriate primitive here.

## 4.3 Authorization / RBAC: not implemented

`packages/trpc/server/trpc.ts` defines exactly one procedure builder:

```ts
export const publicProcedure = tRPCContext.procedure;
```

There is no `protectedProcedure`, no `tRPCContext.middleware(...)` call, and no
role check anywhere in the repository. `TRPCError` is imported in `trpc.ts` but
unused.

`createContext` builds a context containing only three cookie helpers. It does
**not** read the authentication cookie, does not verify the JWT, and does not
attach a user:

```ts
const ctx: TRPCContext = {
  createCookie: createCookieFactory(res),
  getCookie:    getCookieFactory(req),
  clearCookie:  clearCookieFactory(res),
};
```

**Consequence:** every endpoint listed in [Section 7](#7-api-reference) is
reachable without credentials — including report creation and report download.
`apps/web/features/rbac/` is an empty placeholder.

## 4.4 Transport, secrets and input validation

| Control | Status |
|---|---|
| Input validation | **Present.** Every tRPC procedure has a Zod `.input()` schema; both job payloads are re-parsed inside the worker. Env is Zod-validated per package and throws at boot on failure. |
| Path traversal on download | **Guarded.** `getReportFilePath` rejects any `storageKey` where `path.basename(key) !== key`. |
| SQL injection | **Low risk.** All access goes through Drizzle's parameterised query builder; there is no raw SQL in application code. |
| Security headers | **Absent.** No `helmet`, no HSTS, CSP, `X-Frame-Options` or `nosniff`. |
| Rate limiting / brute-force protection | **Absent.** |
| HTTPS enforcement | **Absent.** Cookie `secure` is hard-coded `false`. |
| CORS in production | **Absent by design** — the `cors()` middleware is skipped when `NODE_ENV === "prod"`. |
| Secret management | `.env` files only; `setup.sh` hard-links the root `.env` into every workspace package. |
| Queue dashboard auth | **None.** `/queues` is unauthenticated (dev-only mount). |

---

# 5. Data Model

## 5.1 Entity-Relationship Diagram

The database currently holds **two independent tables with no foreign keys and
no declared relations**. The diagram reflects that honestly — `reports` records
*who* nothing; it has no owner column.

```mermaid
erDiagram
    users {
        uuid id PK "DEFAULT gen_random_uuid()"
        varchar_80 full_name "NOT NULL"
        varchar_255 email "NOT NULL, UNIQUE (users_email_unique)"
        boolean email_verified "DEFAULT false"
        text profile_image_url "nullable"
        text salt "nullable - 16 random bytes, hex"
        text password "nullable - HMAC-SHA256 digest, hex"
        timestamp created_at "DEFAULT now()"
        timestamp updated_at "nullable - set by Drizzle $onUpdate"
    }

    reports {
        uuid id PK "DEFAULT gen_random_uuid()"
        varchar_80 report_type "NOT NULL - only 'user-summary' produced"
        varchar_20 status "NOT NULL DEFAULT 'queued' - queued|processing|ready|failed"
        varchar_255 storage_key "nullable - basename of CSV in local-reports/"
        varchar_255 file_name "nullable - download filename"
        integer file_size_bytes "nullable - fs.stat size"
        varchar_255 failure_message "nullable"
        timestamp requested_at "NOT NULL DEFAULT now()"
        timestamp started_at "nullable - set when worker picks up"
        timestamp completed_at "nullable - set on success"
    }

    users ||..|| reports : "NO FOREIGN KEY EXISTS — reports has no owner column; the report worker aggregates COUNT(*) over all users"
```

## 5.2 Data dictionary

### `users`

Defined in `packages/database/models/user.ts`; created by migration
`0000_dusty_morg.sql`, extended by `0001_harsh_captain_universe.sql`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key. Also the JWT `id` claim. |
| `full_name` | `varchar(80)` | no | — | Validated as `z.string().min(1)` at the route. |
| `email` | `varchar(255)` | no | — | `UNIQUE` constraint `users_email_unique`. Also checked in application code before insert (race-prone). |
| `email_verified` | `boolean` | yes | `false` | **Never written to after insert** — no verification flow exists. |
| `profile_image_url` | `text` | yes | — | Never written; selected by `getUserInfoById`. |
| `salt` | `text` | yes | — | 16 random bytes hex-encoded, per user. Added in migration `0001`. |
| `password` | `text` | yes | — | `HMAC-SHA256(salt, password)` hex digest. Added in migration `0001`. Nullable to allow future federated identities. |
| `created_at` | `timestamp` | yes | `now()` | No timezone (`timestamp`, not `timestamptz`). |
| `updated_at` | `timestamp` | yes | — | Maintained by Drizzle's `$onUpdate` in **application code only**; no DB trigger. |

TypeScript types: `SelectUser`, `InsertUser`.

### `reports`

Defined in `packages/database/models/report.ts`; created by migration
`0002_stormy_the_stranger.sql`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key. Also derives the BullMQ job id: `report-<id>`. |
| `report_type` | `varchar(80)` | no | — | Only `'user-summary'` is ever inserted (`createDemoReport` hard-codes it). The worker throws `Unsupported report type` for anything else. |
| `status` | `varchar(20)` | no | `'queued'` | Enum enforced **in TypeScript only** (`reportStatusValues`). No `CHECK` constraint or PG enum type in the migration. Lifecycle: `queued → processing → ready \| failed`. |
| `storage_key` | `varchar(255)` | yes | — | `user-summary-<reportId>.csv`. Resolved against `./local-reports/` with a basename guard. |
| `file_name` | `varchar(255)` | yes | — | Always `'user-summary.csv'` — the name sent as the download attachment. |
| `file_size_bytes` | `integer` | yes | — | From `fs.stat()` after write. |
| `failure_message` | `varchar(255)` | yes | — | Set to a fixed string `'Generation failed. Retry the report.'` on terminal failure; cleared on each `processing` transition. The real error is only logged, never persisted. |
| `requested_at` | `timestamp` | no | `now()` | Enqueue time. |
| `started_at` | `timestamp` | yes | — | Set on every attempt, including retries. |
| `completed_at` | `timestamp` | yes | — | Set once on success. |

TypeScript types: `SelectReport`, `InsertReport`.

### Indexes and constraints

| Object | Table | Kind |
|---|---|---|
| Primary key on `id` | `users` | implicit unique B-tree |
| `users_email_unique` | `users` | unique constraint on `email` |
| Primary key on `id` | `reports` | implicit unique B-tree |

No other indexes exist. In particular there is **no index on
`reports.status`** or `reports.requested_at`, which any future worker-polling
or admin listing query would need.

## 5.3 Migrations

Managed by drizzle-kit; journal at `packages/database/drizzle/meta/_journal.json`
(version 7, dialect `postgresql`).

| idx | Tag | Effect |
|---|---|---|
| 0 | `0000_dusty_morg` | `CREATE TABLE users` (without `salt`/`password`) |
| 1 | `0001_harsh_captain_universe` | `ALTER TABLE users ADD COLUMN salt text`, `ADD COLUMN password text` |
| 2 | `0002_stormy_the_stranger` | `CREATE TABLE reports` |

Commands: `pnpm db:generate` (diff schema → SQL) and `pnpm db:migrate` (apply),
both routed through Turborepo to `@repo/database`. Migration is **manual** —
nothing in `Dockerfile.jobs` or `docker-compose.yml` runs it.

---

# 6. Background Job Architecture

## 6.1 Redis connection

`packages/jobs/connection.ts` parses `REDIS_URL` into BullMQ
`ConnectionOptions`:

```ts
const url = new URL(env.REDIS_URL);
return {
  host: url.hostname,
  port: url.port ? Number(url.port) : 6379,
  username: url.username || undefined,
  password: url.password || undefined,
  maxRetriesPerRequest: null,   // required by BullMQ for blocking commands
};
```

A **new connection object is created per call site** — each `Queue` and each
`Worker` gets its own. TLS (`rediss://`) is not handled; the scheme is ignored.

## 6.2 Queue definitions

| | `demo` | `report-generation` |
|---|---|---|
| Constant | `DEMO_QUEUE_NAME` | `REPORT_QUEUE_NAME` |
| Job name | `ping` | `generate` |
| Payload schema | `{ message: string (min 1) }` | `{ reportId: uuid }` |
| Result schema | `{ received: string }` | `{ reportId, storageKey }` |
| `attempts` | not set (BullMQ default: 1) | `3` |
| `backoff` | — | `exponential`, base delay `1000 ms` |
| Explicit `jobId` | no (auto-increment) | yes — `report-<reportId>`, which **deduplicates** repeat enqueues for the same report |
| `removeOnComplete` | keep last 100 | keep last 100 |
| `removeOnFail` | keep last 100 | keep last 100 |
| Worker concurrency | BullMQ default (1) | `2` |

## 6.3 Worker processes and scaling

Two entry points exist:

- `packages/jobs/worker.ts` — starts **both** workers in one process
  (`pnpm --filter @repo/jobs dev`).
- `packages/jobs/workers/reports.ts` — starts **only** the report worker
  (`start:reports` / `dev:reports`). This is the unit that scales horizontally.

Both install `SIGINT`/`SIGTERM` handlers with a `shuttingDown` guard and call
`worker.close()`, which lets BullMQ finish in-flight jobs before exiting.

Scaling is handled by Redis: every report worker instance blocks on the same
queue key, so N replicas process up to `N × 2` reports concurrently with no
coordination code. `docker-compose.yml` exposes the worker under the `workers`
profile, so `docker compose --profile workers up --scale reports-worker=3`
is the scaling lever.

**Important constraint:** generated CSVs are written to the worker's **local
filesystem** (`./local-reports`, bind-mounted in compose). The API process
serves downloads from *its own* filesystem. Scaling workers across separate
hosts breaks downloads unless that directory is a shared volume or is replaced
by object storage.

## 6.4 Failure handling

`generateReport` throws on a missing report row or an unsupported report type.
BullMQ retries up to 3 times with exponential backoff. The `failed` listener
only marks the DB row when the final attempt is exhausted:

```ts
if (reportId && job?.attemptsMade === job.opts.attempts) void markReportFailed(reportId);
```

The stored `failure_message` is a fixed generic string; the actual error text is
written to the winston log only. There is **no dead-letter queue** and no
automatic cleanup of orphaned CSV files.

---

# 7. API Reference

## 7.1 How the surface is exposed

Each tRPC procedure is published in **two** ways:

1. **Native tRPC** at `POST|GET /trpc/<router>.<procedure>` — used by
   `apps/web` through `@trpc/react-query`.
2. **REST** at `/api/<openapi.path>` — generated by `trpc-to-openapi` from the
   `.meta({ openapi: ... })` block on each procedure. The OpenAPI document is
   built with `baseUrl: env.BASE_URL + "/api"`.

A machine-readable spec is served at `GET /openapi.json` and rendered by Scalar
at `GET /docs`.

**Auth requirement for every endpoint below: none.** All procedures are
`publicProcedure` and no middleware inspects the `authentication-token` cookie.

### Plain Express endpoints (not part of the tRPC router)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Liveness banner — `{ "message": "EMS is up and running..." }` |
| `GET` | `/health` | `{ "message": "EMS API server is healthy", "healthy": true }` |
| `GET` | `/reports/:reportId/download` | Streams the generated CSV |
| `GET` | `/openapi.json` | OpenAPI 3 document |
| `GET` | `/docs` | Scalar API reference UI |
| `GET` | `/queues` | Bull Board dashboard — **mounted only when `NODE_ENV !== "prod"`** |

---

## 7.2 Health

### `GET /api/health` — `health.getHealth`

| | |
|---|---|
| tRPC path | `health.getHealth` (query) |
| Auth | none |
| Input | `undefined` (`zodUndefinedModel`) |

**Response `200`**

```json
{ "status": "healthy" }
```

> Note: the Express route `GET /health` (Section 7.1) is a **different** handler
> with a different body. The tRPC-generated one lives under the `/api` prefix.

---

## 7.3 Authentication

Router key: `authRouter`. OpenAPI tag: `Authentication`.

### `POST /api/authentication/create-user-with-email-and-password`

| | |
|---|---|
| tRPC path | `authRouter.createUserWithEmailAndPassword` (mutation) |
| Auth | none |
| Summary | Create a user with email and password |
| Side effect | Sets HTTP-only cookie `authentication-token` (JWT, `sameSite=strict`, `secure=false`, `maxAge` 1 year) |

**Request body**

| Field | Type | Rule |
|---|---|---|
| `fullName` | `string` | `min(1)` |
| `email` | `string` | RFC email format |
| `password` | `string` | `min(8)` |

```json
{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct-horse-battery"
}
```

**Response `200`**

```json
{ "id": "6789f312-7a49-4d12-a2c4-129cd3b49e4e" }
```

`Set-Cookie: authentication-token=<jwt>; Path=/; HttpOnly; SameSite=Strict; Max-Age=31104000`

**Errors** — the service throws plain `Error` objects, which tRPC surfaces as
`INTERNAL_SERVER_ERROR` (HTTP 500), not 409/400:

| Condition | Message |
|---|---|
| Email already registered | `user with email <email> already exists` |
| Insert returned no row | `something went wrong while creating a user` |

> **Not exposed:** `UserService.signInUserWithEmailAndPassword` and
> `UserService.verifyAndDecodeUserToken` are implemented but have no route.
> There is no login, logout, refresh, password-reset or email-verification
> endpoint.

---

## 7.4 Reports

Router key: `reports`. OpenAPI tag: `Reports`.

### `POST /api/reports`

| | |
|---|---|
| tRPC path | `reports.create` (mutation) |
| Auth | none |
| Summary | Queues a report and returns before the file is generated |

**Request body**

| Field | Type | Rule |
|---|---|---|
| `reportType` | `"user-summary"` | literal — the only accepted value |

```json
{ "reportType": "user-summary" }
```

> **Behavioural note:** the handler signature is `async () => {...}` — the
> validated `reportType` is **discarded**. `createDemoReport()` always inserts
> `report_type = "user-summary"` regardless of input.

**Response `200`**

```json
{
  "reportId": "9a091414-a365-4ece-a33c-7db19ed2f205",
  "jobId": "report-9a091414-a365-4ece-a33c-7db19ed2f205",
  "status": "queued"
}
```

### `GET /api/reports/{reportId}`

| | |
|---|---|
| tRPC path | `reports.get` (query) |
| Auth | none |
| Summary | Get report generation status |

**Path parameters**

| Name | Type | Rule |
|---|---|---|
| `reportId` | `string` | UUID |

**Response `200` — still queued**

```json
{
  "id": "9a091414-a365-4ece-a33c-7db19ed2f205",
  "reportType": "user-summary",
  "status": "queued",
  "fileName": null,
  "fileSizeBytes": null,
  "failureMessage": null,
  "requestedAt": "2026-11-16T09:41:12.004Z",
  "startedAt": null,
  "completedAt": null,
  "downloadPath": null
}
```

**Response `200` — ready**

```json
{
  "id": "9a091414-a365-4ece-a33c-7db19ed2f205",
  "reportType": "user-summary",
  "status": "ready",
  "fileName": "user-summary.csv",
  "fileSizeBytes": 97,
  "failureMessage": null,
  "requestedAt": "2026-11-16T09:41:12.004Z",
  "startedAt": "2026-11-16T09:41:12.233Z",
  "completedAt": "2026-11-16T09:41:12.301Z",
  "downloadPath": "/reports/9a091414-a365-4ece-a33c-7db19ed2f205/download"
}
```

**Response `200` — failed**

```json
{
  "id": "9a091414-a365-4ece-a33c-7db19ed2f205",
  "reportType": "user-summary",
  "status": "failed",
  "fileName": null,
  "fileSizeBytes": null,
  "failureMessage": "Generation failed. Retry the report.",
  "requestedAt": "2026-11-16T09:41:12.004Z",
  "startedAt": "2026-11-16T09:41:12.233Z",
  "completedAt": null,
  "downloadPath": null
}
```

**Errors**

| Code | Condition |
|---|---|
| `NOT_FOUND` (404) | No `reports` row with that id — `"Report not found"` |

### `GET /reports/{reportId}/download`

Plain Express route — **not** under `/api`, not in the OpenAPI document.

| | |
|---|---|
| Auth | none |
| Precondition | Row exists **and** `status = 'ready'` **and** `storage_key` and `file_name` are non-null |

**Response `200`** — `Content-Disposition: attachment; filename="user-summary.csv"`

```csv
metric,value
generated_at,2026-11-16T09:41:12.288Z
registered_user_count,42
```

**Response `404`**

```json
{ "message": "Report file is not ready" }
```

---

## 7.5 Jobs (demo queue)

Router key: `jobs`. OpenAPI tag: `Jobs`. These endpoints exist to exercise the
BullMQ wiring and have no business meaning.

### `POST /api/jobs/demo`

| | |
|---|---|
| tRPC path | `jobs.enqueueDemo` (mutation) |
| Auth | none |
| Summary | Adds a message to the demo BullMQ queue |

**Request body**

| Field | Type | Rule |
|---|---|---|
| `message` | `string` | `min(1)` — the worker logs and echoes it |

```json
{ "message": "hello queue" }
```

**Response `200`**

```json
{ "jobId": "12" }
```

### `GET /api/jobs/{jobId}`

| | |
|---|---|
| tRPC path | `jobs.getDemo` (query) |
| Auth | none |
| Summary | Returns the state and result of a demo BullMQ job |

**Path parameters**

| Name | Type | Rule |
|---|---|---|
| `jobId` | `string` | `min(1)` — BullMQ job id |

**Response `200`**

```json
{
  "jobId": "12",
  "state": "completed",
  "result": { "received": "hello queue" },
  "failedReason": null
}
```

`state` is BullMQ's own string (`waiting`, `active`, `completed`, `failed`,
`delayed`, `unknown`). `result` is `null` until the job completes.

**Errors**

| Code | Condition |
|---|---|
| `NOT_FOUND` (404) | Job id not present in Redis (note: `removeOnComplete` keeps only the last 100) — `"Demo job not found"` |

---

# 8. Local Setup & Environment

## 8.1 Environment variables

Each package validates its own slice of `process.env` with Zod at import time
and **throws on failure**, so a missing required variable stops the process at
boot.

| Variable | Required | Default | Consumed by | Purpose |
|---|---|---|---|---|
| `DATABASE_URL` | **yes** | — | `packages/database/env.ts` | PostgreSQL connection string for Drizzle and drizzle-kit. Format: `postgresql://<user>:<password>@<host>:<port>/<database>` |
| `JWT_SECRET` | **yes** | — | `packages/services/env.ts`, `apps/api/src/env.ts` | HMAC key used to sign and verify auth JWTs |
| `REDIS_URL` | no | `redis://127.0.0.1:6379` | `packages/jobs/env.ts` | Parsed into BullMQ host/port/username/password |
| `PORT` | no | `8000` | `apps/api/src/env.ts` | API listen port. The checked-in local `.env` uses `3001` |
| `BASE_URL` | no | `http://localhost:8000` | `apps/api/src/env.ts` | Used as the OpenAPI server URL (`BASE_URL + "/api"`) and in startup log lines |
| `NODE_ENV` | no | `development` | `apps/api/src/env.ts`, `packages/logger/env.ts` | Only `development` \| `prod` are accepted. Gates CORS, the `/queues` dashboard and the log format |
| `LOGGER_LEVEL` | no | `debug` in development, `error` otherwise | `packages/logger/env.ts` | One of `error` \| `debug` \| `info` |
| `NEXT_PUBLIC_API_URL` | no | `http://localhost:3001/trpc` (code fallback) | `apps/web/env.js` | tRPC endpoint the browser calls |
| `SKIP_ENV_VALIDATION` | no | unset | `apps/web/env.js` | Bypasses `@t3-oss/env-nextjs` validation (Docker builds) |

A ready-to-use root `.env` for local development:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev
JWT_SECRET=replace-with-a-long-random-string
REDIS_URL=redis://127.0.0.1:6379
PORT=3001
BASE_URL=http://localhost:3001
NODE_ENV=development
LOGGER_LEVEL=debug
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
```

> `setup.sh` iterates `apps/*` and `packages/*` and hard-links the root `.env`
> into each one, so every workspace sees the same file. It copies from
> `.env.example` when no `.env` exists — **but `.env.example` is not committed
> to the repository**, so the file must be created by hand first.

## 8.2 Prerequisites

- Node.js `>= 18` (CI/Docker images use Node 22)
- pnpm `9.0.0` — `corepack enable` is sufficient
- Docker (for PostgreSQL and Redis)

## 8.3 Running locally

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Create the root .env (see 8.1), then fan it out to every package
chmod +x setup.sh && ./setup.sh

# 3. Start PostgreSQL 15 and Redis 7
docker compose up -d postgresdb redis

# 4. Apply migrations (creates users and reports)
pnpm db:migrate

# 5. Start the API (:3001) and the web client (:3000)
pnpm dev

# 6. In a second terminal, start a worker process
pnpm --filter @repo/jobs dev           # demo + report workers
# or, report worker only:
pnpm --filter @repo/jobs dev:reports
```

> The compose file publishes PostgreSQL with `POSTGRES_DB=dev` and
> `postgres/postgres` credentials on `localhost:5432`, and Redis on
> `localhost:6379` with AOF persistence enabled.

### Useful endpoints once running

| URL | What |
|---|---|
| `http://localhost:3000` | Next.js client |
| `http://localhost:3000/signup` | Working signup form |
| `http://localhost:3001/health` | API liveness |
| `http://localhost:3001/docs` | Scalar API reference |
| `http://localhost:3001/openapi.json` | OpenAPI document |
| `http://localhost:3001/queues` | Bull Board queue dashboard (non-prod only) |

### Smoke-testing the report pipeline

`test-report.sh` fires six report requests in a row — enough to observe the
worker's `concurrency: 2` throttle:

```bash
./test-report.sh
curl http://localhost:3001/api/reports/<reportId>
curl -OJ http://localhost:3001/reports/<reportId>/download
```

### Other workspace commands

| Command | Effect |
|---|---|
| `pnpm build` | `turbo build` across the workspace (API via tsup, web via `next build`) |
| `pnpm db:generate` | Diff `schema.ts` against the snapshots and emit a new migration |
| `pnpm lint` | `turbo run lint` |
| `pnpm check-types` | `turbo run check-types` |
| `pnpm format` | Prettier over `**/*.{ts,tsx,md}` |

## 8.4 Containerised workers

`Dockerfile.jobs` builds a `node:22-alpine` image, enables corepack, copies the
whole repository, runs `pnpm install --frozen-lockfile` and defaults to
`pnpm --filter @repo/jobs start:reports`.

```bash
docker compose --profile workers up --build --scale reports-worker=3
```

The service bind-mounts `./local-reports` into `/app/local-reports` so generated
CSVs land on the host where the API can serve them.

> **Known defect:** the `reports-worker` service sets
> `DATABASE_URL=postgresql://postgres:postgres@postgresdb:5432/postgres`, but
> the `postgresdb` service is created with `POSTGRES_DB=dev`. The containerised
> worker therefore connects to the wrong database and will not find the
> `reports` table.

---

# 9. Production Readiness Gaps

A short audit checklist. Every item below was verified absent (or defective) in
the current source tree.

## 9.1 Security — blocking

- [ ] **No authentication enforcement.** Only `publicProcedure` exists; no
      `protectedProcedure`, no tRPC middleware, and `createContext` never reads
      or verifies the auth cookie. Report creation and download are open to
      anonymous callers.
- [ ] **No login endpoint.** `signInUserWithEmailAndPassword` and
      `verifyAndDecodeUserToken` are implemented but unrouted; users can sign up
      and never sign in again.
- [ ] **Password hashing is not a KDF.** `HMAC-SHA256(salt, password)` is a
      single fast iteration. Migrate to Argon2id, scrypt or bcrypt with a
      versioned hash column.
- [ ] **JWTs never expire.** `JWT.sign({ id }, secret)` sets no `expiresIn`,
      `iss` or `aud`, and there is no refresh or revocation path. The cookie
      itself has a one-year `maxAge`.
- [ ] **Cookie `secure` is hard-coded `false`**, so the session token is sent
      over plain HTTP even in production.
- [ ] **No rate limiting or brute-force protection** on any route.
- [ ] **No security headers** — `helmet` is not installed; no CSP, HSTS,
      `X-Content-Type-Options` or `X-Frame-Options`.
- [ ] **CORS is disabled in production.** The `cors()` middleware is mounted
      only when `NODE_ENV !== "prod"`, so a deployed browser client would be
      blocked outright; the allowed origin is also hard-coded to
      `http://localhost:3000`.
- [ ] **Bull Board is unauthenticated.** It is dev-only today, but exposing it
      anywhere requires an auth gate.

## 9.2 Multi-tenancy and RBAC — not started

- [ ] No tenant/organization entity, no `tenant_id` on any table, no scoping in
      any query.
- [ ] No roles, permissions or membership model; `apps/web/features/rbac/` and
      `features/tenant/` are empty.
- [ ] `reports` has no owner column — any caller who knows a UUID can download
      any report.

## 9.3 Data layer

- [ ] **No foreign keys and no Drizzle `relations()`** anywhere in the schema.
- [ ] **`reports.status` has no DB-level constraint** — the enum is enforced in
      TypeScript only; a direct `UPDATE` can write any 20-char string.
- [ ] **No indexes** beyond the two primary keys and `users_email_unique`.
      `reports.status` and `reports.requested_at` will need them.
- [ ] **Timestamps are `timestamp`, not `timestamptz`** — no timezone is stored.
- [ ] **`updated_at` is maintained in application code only** (`$onUpdate`);
      direct SQL writes silently skip it.
- [ ] **Migrations are never run automatically** — no entrypoint script, no
      migrate step in `Dockerfile.jobs` or compose.
- [ ] **Duplicate-email check is race-prone** — a `SELECT` then `INSERT` without
      a transaction; the unique constraint is the only real guard, and its
      violation surfaces as a 500.
- [ ] No seed data, no backup/restore procedure, no connection-pool tuning
      (`drizzle(env.DATABASE_URL)` uses `pg` defaults).

## 9.4 Reliability and operations

- [ ] **No Express error-handling middleware and no 404 handler.** Unhandled
      errors fall through to Express's default handler and leak stack traces in
      development.
- [ ] **No graceful shutdown for the API process** — workers handle
      `SIGINT`/`SIGTERM`, `apps/api/src/index.ts` does not.
- [ ] **Reports are written to local disk**, not object storage. Scaling workers
      onto separate hosts breaks `GET /reports/:id/download` unless the
      directory is a shared volume.
- [ ] **No cleanup of generated CSVs** — `local-reports/` grows unbounded; seven
      stale files are already checked into the working tree.
- [ ] **Failure detail is lost** — `failure_message` is a fixed string; the real
      error reaches the log only.
- [ ] **No dead-letter queue** and no alerting on exhausted retries.
- [ ] **No readiness probe.** `/health` returns a static literal and does not
      check PostgreSQL or Redis connectivity.
- [ ] **No request logging or correlation IDs.** winston is configured but never
      wired into the Express pipeline.
- [ ] **No metrics, tracing or APM** of any kind.
- [ ] **No TLS support for Redis** — `connection.ts` ignores the URL scheme, so
      `rediss://` silently downgrades.

## 9.5 Compliance and auditability

- [ ] **No audit log.** No table or code path records who did what, when.
- [ ] **No soft deletes or data-retention policy.**
- [ ] **No PII handling controls** — no encryption at rest beyond what Postgres
      provides, no redaction in logs.
- [ ] **No email verification flow**, despite `users.email_verified` existing
      and never being written.

## 9.6 Engineering hygiene

- [ ] **No tests at all** — no test runner, no test files, no coverage config.
- [ ] **No CI/CD** — no `.github/workflows`, no pipeline definition.
- [ ] **`.env.example` is missing** even though `setup.sh` copies from it.
- [ ] **`apps/web/app/page.tsx` is stale and broken** — it calls
      `trpc.emsTest.useQuery()`, a procedure that does not exist on
      `serverRouter`, and renders an undefined `status` variable. It also still
      carries placeholder "Streamyst / Media Forwarding" branding, as does
      `app/layout.tsx`'s `metadata`.
- [ ] **`reports.create` discards its validated input** — the handler takes no
      arguments and always produces a `user-summary` report.
- [ ] **`google-auth-library` is an unused dependency** of `@repo/services`.
- [ ] **`TRPCError` is imported but unused** in `packages/trpc/server/trpc.ts`;
      `tsup.config.ts` still carries a `noExternal: ["@teachyst"]` entry from a
      different project.
- [ ] **The root `README.md` is the unmodified Turborepo starter template** and
      describes packages (`docs`, `@repo/ui`) that do not exist here.
- [ ] **No Dockerfile for `apps/api` or `apps/web`** — only the worker is
      containerised.
- [ ] **No API versioning strategy** — routes are mounted flat under `/api`.
