# Queue setup

This is the working Redis and BullMQ setup in this repo. Use it as the pattern for the next background feature.

The API does not do the slow work. A tRPC procedure puts a job in Redis and returns immediately. A separate worker process reads that job and does the work.

## The pieces

| Piece        | Where                                       | What it does                                                |
| ------------ | ------------------------------------------- | ----------------------------------------------------------- |
| Redis        | `docker-compose.yml`                        | Stores the queues and jobs. Runs on `127.0.0.1:6379`.       |
| Connection   | `packages/jobs/connection.ts`               | Turns `REDIS_URL` into BullMQ connection options.           |
| Job contract | `packages/jobs/demo-job.ts`                 | Queue name, payload schema, and result schema.              |
| Queue        | `packages/jobs/queue.ts`                    | Producer. Adds jobs and reads their status.                 |
| Worker       | `packages/jobs/worker.ts`                   | Consumer. Runs in its own process and performs the job.     |
| tRPC route   | `packages/trpc/server/routes/jobs/route.ts` | The HTTP entry point. It only enqueues or reads a job.      |
| Dashboard    | `apps/api/src/queue-dashboard.ts`           | Bull Board UI. `BullMQAdapter` lets the UI inspect a queue. |

```text
Browser or OpenAPI
        |
        v
tRPC procedure  --calls-->  enqueueDemoJob()
                                    |
                                    v
                              Queue.add()
                                    |
                                    v
                                 Redis
                                    |
                                    v
                          Worker in packages/jobs
                                    |
                                    v
                          job result stored in Redis
                                    |
                                    v
                         Bull Board at /queues
```

## How a request moves

1. `pnpm dev` starts the API and the worker. Turbo runs every package `dev` script, including `packages/jobs`.
2. The API imports `demoQueue` when it starts. That opens a Redis connection for adding jobs.
3. `POST /api/jobs/demo` calls `jobs.enqueueDemo`.
4. `enqueueDemoJob()` validates the payload and calls `demoQueue.add("ping", data)`.
5. BullMQ writes the job to Redis and returns a `jobId`. The HTTP response ends here.
6. The worker, which is already waiting on the `demo` queue, receives the job.
7. The worker validates `job.data`, does the work, and returns a result. BullMQ stores that result on the job.
8. `GET /api/jobs/{jobId}` reads the same job back and returns `state` and `result`.

The worker file is a script. Do not import `worker.ts` from the API. Importing it would start a second consumer inside the API process.

## Redis

Start Redis with the rest of the local dependencies:

```sh
docker compose up -d redis
```

`packages/jobs/env.ts` reads `REDIS_URL`. When the variable is missing, it uses `redis://127.0.0.1:6379`, which matches the Compose port.

`createRedisConnectionOptions()` sets `maxRetriesPerRequest: null`. BullMQ workers use blocking Redis commands, and that option must be `null` or the worker can fail while waiting for a job.

Each `Queue` and `Worker` receives its own options object. BullMQ opens the actual Redis connections. Do not create one shared Redis client and pass that same client to both.

## Queue and worker

`demo-job.ts` is the contract shared by the producer and the consumer:

- `DEMO_QUEUE_NAME` is the queue name: `demo`.
- `demoJobData` is the payload the producer sends.
- `demoJobResult` is what the worker returns.

`queue.ts` creates the producer:

```ts
export const demoQueue = new Queue<DemoJobData, DemoJobResult, "ping">(DEMO_QUEUE_NAME, {
  connection: createRedisConnectionOptions(),
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});
```

`removeOnComplete` keeps the latest 100 finished jobs so the dashboard and `getDemoJob()` can still read them.

The worker listens to the same queue name:

```ts
const worker = new Worker(
  DEMO_QUEUE_NAME,
  async (job) => {
    const data = demoJobData.parse(job.data);
    return demoJobResult.parse({ received: data.message });
  },
  { connection: createRedisConnectionOptions() },
);
```

Validate `job.data` inside the worker. The tRPC input check only protects the HTTP call. A retried or manually added job can still arrive with bad data.

The value returned from the worker becomes `job.returnvalue`. Throwing inside the worker marks the job failed and stores `job.failedReason`.

Job states you will see:

| State       | Meaning                                |
| ----------- | -------------------------------------- |
| `waiting`   | Stored in Redis, not started.          |
| `delayed`   | Waiting until its scheduled time.      |
| `active`    | A worker is processing it.             |
| `completed` | The worker returned a result.          |
| `failed`    | The worker threw. BullMQ can retry it. |

## tRPC

The route stays thin. It checks input and calls the jobs package.

```ts
enqueueDemo: publicProcedure
  .input(enqueueDemoJobInputModel)
  .output(enqueueDemoJobOutputModel)
  .mutation(async ({ input }) => {
    return enqueueDemoJob(input);
  }),
```

`jobs` is registered in `packages/trpc/server/index.ts`, so the web client and OpenAPI both see it.

Use a mutation to enqueue. Use a query only to read status. Do not put the real work in the procedure. If the procedure sends email, imports attendance, or calls Jira directly, the user waits on that work and a timeout or retry can run it twice.

The current demo routes are public so the setup is easy to try. A real HR route must use the authenticated procedure and must check the caller's tenant and role before enqueueing.

## BullMQAdapter and the dashboard

`BullMQAdapter` is not the worker. It is the Bull Board adapter that knows how to read a BullMQ `Queue`.

```ts
createBullBoard({
  queues: [new BullMQAdapter(demoQueue)],
  serverAdapter,
});
```

`server.ts` mounts this at `/queues` only when `NODE_ENV` is not `prod`. Open [http://localhost:3001/queues](http://localhost:3001/queues).

Every new queue needs its own `new BullMQAdapter(yourQueue)` entry or it will not appear in the dashboard.

## Run and try the current demo

```sh
docker compose up -d redis
pnpm dev
```

Enqueue from the API docs at [http://localhost:3001/docs](http://localhost:3001/docs), or:

```sh
curl -X POST http://localhost:3001/api/jobs/demo \
  -H 'content-type: application/json' \
  -d '{"message":"hello"}'
```

The response is `{ "jobId": "..." }`. Open the dashboard, select `demo`, and confirm the job moves to `completed`. The worker log prints `demo job received`.

If the dashboard shows a waiting job and the worker log is silent, the `@repo/jobs` dev process is not running. Restart `pnpm dev`.

## Add another queue

Keep one queue per kind of work. Do not put invitation email and Jira sync on the same queue.

1. Add a contract file in `packages/jobs`, for example `invitation-job.ts`, with the queue name, Zod payload, and result.
2. Add `invitation-queue.ts` with a `Queue`, an `enqueue...` function, and a status function if the caller needs it.
3. Export the enqueue function from `packages/jobs/index.ts`.
4. Add a `Worker` in `packages/jobs/worker.ts` for that queue name. One worker process can own several workers.
5. Add `new BullMQAdapter(invitationQueue)` in `apps/api/src/queue-dashboard.ts`.
6. Add a tRPC mutation that authorizes the caller, calls the enqueue function, and returns the `jobId`.
7. Restart `pnpm dev` and confirm the new queue appears in the dashboard.

Give the queue a stable name such as `invitation-email`. The first argument to `queue.add()` is the job name, such as `send`. The queue name and job name are different.

For a job that must not run twice, pass a deterministic BullMQ job id:

```ts
await invitationQueue.add("send", data, {
  jobId: `invitation-${data.invitationId}`,
});
```

If that job id already exists, BullMQ rejects the duplicate instead of sending a second email.

## Use cases

### 1. Demo echo — already implemented

Use this to prove the wiring before adding business work.

- Trigger: `jobs.enqueueDemo`.
- Queue: `demo`.
- Job name: `ping`.
- Payload: `{ message: string }`.
- Worker: validate the message and return `{ received: message }`.
- Result: read it back with `jobs.getDemo`.

### 2. Send an invitation email now

Use this when HR clicks "Send invitation" and the request should return before the email provider responds.

- Trigger: the invitation mutation, after the employee and invitation rows are saved.
- Queue: `invitation-email`.
- Job name: `send`.
- Payload: `{ tenantId, invitationId }`. Store ids, not the full email body. The worker loads the current invitation from the database.
- Worker: load the invitation, skip it unless its status is still sendable, send the email, then set the status to `Sent` or record the failure.
- Job id: `invitation-${invitationId}` so a double click does not send two emails.
- Result: the mutation returns the invitation id and job id. The UI reads invitation status from the database, not from the job result.

### 3. Send an invitation at a later time

Use this for "Schedule invitation". The job waits in Redis until the selected time.

- Trigger: the schedule mutation, after it rejects a past date and saves the invitation as `Scheduled`.
- Queue: `invitation-email`.
- Job name: `send`.
- Payload: `{ tenantId, invitationId }`.
- Options: `delay` is the number of milliseconds from now until the selected time. BullMQ shows the job as `delayed`.
- Worker: before sending, load the invitation again. If HR cancelled or rescheduled it, return without sending.
- Reschedule: remove the old delayed job and add a new one. Do not leave both jobs in Redis.
- Cancel: remove the delayed job and mark the invitation `Cancelled`.

The worker still checks the database. Redis delay is the timer. The invitation row is the source of truth.

### 4. Batch compliance-exam notifications to HR

Use this so ten exam attempts become one HR notification instead of ten emails.

- Trigger: each submitted exam attempt.
- Queue: `exam-notification`.
- Job name: `summarize-tenant`.
- Payload: `{ tenantId }`.
- Job id: `exam-summary-${tenantId}`.
- Options: `delay` of a few minutes. While a delayed job with that id exists, further attempts do not create another job.
- Worker: when the delay ends, load attempts recorded since the last summary, send one notification, and store the summary time.
- Result: HR sees one batched notification. The dashboard shows one delayed job per tenant, then one completed job.

### 5. Sync Jira worklogs

Use this for a repeated integration that must be safe to run again.

- Trigger: a repeatable job every sync interval, or an admin "Sync now" mutation.
- Queue: `jira-sync`.
- Job name: `sync-tenant`.
- Payload: `{ tenantId }`.
- Worker: fetch worklogs, upsert them by the Jira worklog id, and write a sync run row with the time and any error.
- Repeatable job id: one scheduler per tenant, so two API instances do not register two schedules.
- Idempotency: the database unique key is the Jira worklog id. Reprocessing the same job must not increase logged hours.
- Result: the dashboard shows the latest sync. The admin screen reads the sync run row for the last success or failure.

Attendance must not be used as a substitute for these worklogs.

### 6. Import biometric attendance

Use this when a device or vendor sends a file or webhook that can be delivered more than once.

- Trigger: a webhook procedure or a scheduled poll.
- Queue: `attendance-import`.
- Job name: `import-batch`.
- Payload: `{ tenantId, importBatchId }`. The raw records belong in stored import data, not in the job payload.
- Worker: import each source record, match it to an employee, and insert an attendance event with a unique source id.
- Idempotency: a repeated source id is skipped or updated. It must not create a second attendance event.
- Failure: leave unmatched records in a reconciliation table. The job can fail or complete with a count of unmatched rows, but it must not discard the source record.
- Result: an admin can see failed and unmatched records. The employee attendance view reads the attendance table.

## Rules for the next feature

- Return from tRPC as soon as the job is in Redis.
- Pass ids in the payload. Let the worker load the current database row.
- Make the worker safe to run twice. Use a deterministic job id and a database unique key.
- Authorize in the procedure. The worker trusts the payload only after the procedure has checked the tenant and role.
- Keep email, Jira, and biometric credentials in environment variables. Do not put secrets in a job payload or log them.
- Log the job id and the record id. Do not log employee-sensitive values. The logger treats a field named `message` specially, so use `payload` or `jobId` instead.
- Register the queue in Bull Board or you will not be able to see whether it is waiting, delayed, or failing.
