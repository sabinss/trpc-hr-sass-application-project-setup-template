# Report generation with Redis and BullMQ

This is a learning implementation. It generates a non-sensitive CSV user-summary report, saves it under `local-reports/`, and lets the browser download it later.

The CSV intentionally contains only aggregate data. It does not export employee names, email addresses, or other personal data.

## The problem

An HTTP request is a poor place to create a large report:

```text
Browser -> API -> database query -> create CSV/PDF -> write file -> download
```

This works for a tiny current-table export. It fails as reports grow:

1. **Request timeouts:** the browser, reverse proxy, or API server can time out before generation finishes.
2. **Database pressure:** 100 users requesting reports can become 100 expensive queries at once. The database connection pool and CPU become saturated.
3. **API starvation:** CPU-heavy CSV/PDF work runs in the API process, reducing its ability to handle sign-in, leave requests, and other normal traffic.
4. **Memory pressure:** building a whole report in memory can crash the API when the report has many rows.
5. **Lost work:** if the user closes the browser, a synchronous request often loses the result even though the server was doing useful work.
6. **Unsafe retry:** browsers and users retry after a timeout. Without idempotency, the same report may be generated many times.

Redis is not the solution by itself. It is the waiting room. The solution is a **bounded worker system**:

```text
Many users -> Redis queue (waiting) -> limited workers -> database and file storage
```

The queue accepts a burst quickly. The worker processes only a safe number of reports at once. Extra reports wait instead of overloading the database.

## The implemented flow

```text
POST /api/reports
      |
      +-> create `reports` database row: queued
      |
      +-> enqueue { reportId } in `report-generation`
      |
      +-> return { reportId, jobId, status: "queued" }

BullMQ report worker (concurrency: 2)
      |
      +-> update row: processing
      +-> query aggregate data
      +-> write local-reports/user-summary-<reportId>.csv
      +-> update row: ready

GET /api/reports/{reportId}
      |
      +-> status and downloadPath

GET /reports/{reportId}/download
      |
      +-> load ready report row
      +-> download the local CSV file
```

The report row in PostgreSQL is the product-facing state. Redis/Bull Board is operational state for developers and administrators.

## What was added

| File                                           | Responsibility                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/database/models/report.ts`           | Persistent report status and local-file metadata.                                   |
| `packages/jobs/reports/job.ts`                 | Queue name and validated job payload/result.                                        |
| `packages/jobs/reports/queue.ts`               | `report-generation` producer, retries, backoff, and idempotent job id.              |
| `packages/jobs/reports/service.ts`             | Creates report rows, generates CSV, writes local file, and reads download metadata. |
| `packages/jobs/reports/worker.ts`              | The worker that consumes at most two report jobs at a time.                         |
| `packages/jobs/worker.ts`                      | Starts the demo and report workers in one process.                                  |
| `packages/trpc/server/routes/reports/route.ts` | Create and status tRPC/OpenAPI endpoints.                                           |
| `apps/api/src/server.ts`                       | Local download endpoint.                                                            |
| `apps/api/src/queue-dashboard.ts`              | Registers the report queue in Bull Board.                                           |

## First run

The report table must exist before trying the API:

```sh
pnpm db:generate
pnpm db:migrate
docker compose up -d redis
pnpm dev
```

Create a report through [API docs](http://localhost:3001/docs), or:

```sh
curl -X POST http://localhost:3001/api/reports \
  -H 'content-type: application/json' \
  -d '{ "reportType": "user-summary" }'
```

The response contains `reportId` and `jobId`. Check it:

```sh
curl http://localhost:3001/api/reports/<reportId>
```

When `status` becomes `ready`, download it:

```sh
curl -OJ http://localhost:3001/reports/<reportId>/download
```

Inspect the worker and queue at:

- [Bull Board](http://localhost:3001/queues)
- The `report-generation` queue in the dashboard
- `local-reports/` for generated files

## How the scale controls work

### 1. Concurrency is limited

The report worker uses:

```ts
{ connection: createRedisConnectionOptions(), concurrency: 2 }
```

At most two report jobs run in this worker process. If 100 users create reports:

- Two jobs are `active`.
- The remaining jobs are `waiting`.
- The API still responds quickly because it only inserts a row and enqueues a small payload.

Two is deliberately conservative for local learning. Choose the production value after measuring report query cost, database capacity, worker CPU/memory, and target wait time.

Adding more worker processes increases total throughput:

```text
one worker process × concurrency 2 = 2 reports at once
three worker processes × concurrency 2 = 6 reports at once
```

Do not increase this blindly. Six large report queries can be worse for the database than two.

### 2. Retries use backoff

The report queue retries three times with exponential backoff:

```ts
attempts: 3
backoff: { type: "exponential", delay: 1_000 }
```

This is useful for a temporary database or filesystem failure. It avoids retrying all failed jobs at the exact same moment.

A job must be safe to retry. This example always writes the same report-specific file name and updates the same report row.

### 3. The job payload is small

Redis receives only:

```ts
{
  reportId;
}
```

The worker looks up the report in PostgreSQL. Do not put report rows, employee data, or file contents in the job payload. Large Redis payloads increase memory and make retries more expensive.

### 4. A stable job id prevents duplicate queue entries

```ts
jobId: `report-${reportId}`;
```

If enqueue is attempted twice for the same report row, BullMQ does not create a second job with that id. The database record is also reused by the retries.

## What happens under load

Assume each report needs five seconds and the worker concurrency is two.

| Users requesting at once | Immediately processing | Waiting initially | Approximate time for final report |
| -----------------------: | ---------------------: | ----------------: | --------------------------------: |
|                        2 |                      2 |                 0 |                         5 seconds |
|                       10 |                      2 |                 8 |                        25 seconds |
|                      100 |                      2 |                98 |                       250 seconds |

This queueing delay is intentional. Without the queue, all 100 reports would attempt to query and write at the same time, likely causing timeouts for every user.

The next bottleneck is usually the database. Improve it in this order:

1. Restrict the report date range and maximum row count.
2. Add indexes for the report filters.
3. Stream CSV rows instead of loading all rows in memory.
4. Keep report concurrency low and measure database load.
5. Move workers to separate processes/containers and scale them deliberately.
6. Use read replicas or precomputed/reporting data only when measured demand requires them.

## Important limitations of this demo

This repository does not yet have authenticated tRPC procedures, tenants, or object storage. Therefore the demo report endpoints are public **only for local learning**. Do not deploy them as-is.

Before an HR report feature is production-ready:

1. Require authentication on create, status, and download endpoints.
2. Save `tenantId` and `requestedByUserId` on the report row.
3. Validate role and record scope on report creation.
4. Re-check that scope at download time. A user could lose access after the report was generated.
5. Save requested filters and a report-definition version in the report row.
6. Store the file in private encrypted object storage, not local disk.
7. Return a short-lived signed download URL after authorization.
8. Set file expiry and scheduled cleanup.
9. Avoid writing sensitive values to worker logs.

## The reliable production improvement: outbox

The demo has two steps: insert the report row, then enqueue Redis work. If the API crashes between those steps, the report can stay `queued` without a job.

For production, create an `outbox_events` row in the same PostgreSQL transaction as the report row:

```text
transaction:
  insert report (queued)
  insert outbox event (report.created)
commit

outbox dispatcher:
  reads unsent events
  enqueues BullMQ job
  marks event dispatched
```

This prevents lost jobs. The worker remains idempotent because an event can still be delivered more than once.

## Next exercise

Change the `user-summary` report into a real, permission-scoped report only after authentication and tenant context exist. Add:

- `tenantId`, requester id, filters, and expiry to the report row.
- A report type such as attendance summary.
- A database query that accepts a date range.
- CSV streaming for large result sets.
- A test that proves one tenant cannot download another tenant's report.
