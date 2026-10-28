# Running and scaling report workers

This guide shows how the report worker runs independently from the API and how multiple worker instances coordinate through Redis.

## What is already separate

The API process does not generate reports. It only:

1. inserts a report row in PostgreSQL;
2. adds `{ reportId }` to the `report-generation` BullMQ queue; and
3. returns the response to the client.

The report worker is a separate Node.js process:

```text
API process                         Report worker process
-----------                         ---------------------
Queue.add({ reportId })  -> Redis -> Worker receives job
                                      |
                                      +-> query PostgreSQL
                                      +-> create CSV/PDF
                                      +-> write report file
                                      +-> update report status
```

The API and worker do not call each other directly. Redis is the shared coordination system, while PostgreSQL holds report state and the report data.

## Current code structure

```text
packages/jobs/
  reports/
    job.ts          queue name and job payload/result contracts
    queue.ts        producer: creates `report-generation` jobs
    service.ts      report database and file-generation logic
    worker.ts       `startReportWorker()` factory
  workers/
    reports.ts      report-only process entry point
  worker.ts         local development entry point that starts all workers
```

`packages/jobs/reports/worker.ts` creates a BullMQ `Worker` with the same queue name and Redis connection settings as `packages/jobs/reports/queue.ts`:

```ts
const worker = new Worker(
  REPORT_QUEUE_NAME,
  async (job) => {
    const data = reportJobData.parse(job.data);
    return generateReport(data.reportId);
  },
  {
    connection: createRedisConnectionOptions(),
    concurrency: 2,
  },
);
```

The important connection is the shared queue name:

```ts
export const REPORT_QUEUE_NAME = "report-generation";
```

The producer writes to that queue, and every report worker listens to that queue.

## How BullMQ coordinates workers through Redis

1. The API calls `reportQueue.add("generate", { reportId })`.
2. BullMQ stores the job and its state in Redis under keys for `report-generation`.
3. Every running report worker waits on Redis for available work.
4. BullMQ atomically moves one waiting job to `active` before a worker processes it.
5. Redis ensures two workers do not claim the same job at the same time.
6. When the worker returns, BullMQ records the job as `completed`; when it throws, BullMQ records/retries it as `failed`.

Do not manipulate BullMQ Redis keys directly. The `Queue` and `Worker` APIs maintain the locks, states, retries, and recovery behavior.

## See it working

Use two terminals. Terminal A runs the API. Terminal B shows the worker logs.

### 1. Start Redis and Postgres

```sh
docker compose up -d redis postgresdb
```

### 2. Start only the API

Stop a running `pnpm dev` first. That command also starts a local report worker, and this test is easier to read when only the worker you start is consuming jobs.

```sh
pnpm --filter @repo/api dev
```

The API listens on `http://localhost:3001`.

### 3. Start one report worker

```sh
pnpm --filter @repo/jobs dev:reports
```

The log should contain `report worker started` and `queue: report-generation`. This process is separate from the API. It connects to Redis at `redis://127.0.0.1:6379`.

### 4. Create a report

```sh
curl -sS -X POST http://localhost:3001/api/reports \
  -H 'content-type: application/json' \
  -d '{"reportType":"user-summary"}'
```

The response returns immediately with `status: "queued"`, a `reportId`, and a `jobId`. The API has not created the CSV yet. It has saved the report row and placed `{ reportId }` in Redis.

### 5. Watch the worker take the job

Terminal B changes from waiting to:

```text
report job received
report job completed
```

Check the saved state:

```sh
curl -sS http://localhost:3001/api/reports/<reportId>
```

`status` becomes `ready`, and `downloadPath` is present. Download the file:

```sh
curl -OJ http://localhost:3001/reports/<reportId>/download
```

The CSV is also in `local-reports/`. Open [http://localhost:3001/queues](http://localhost:3001/queues), select `report-generation`, and confirm the job is `completed`.

### 6. See several workers share one queue

Stop the local report worker with `Ctrl+C` in Terminal B. Leave the API running.

Build and start three report-worker containers:

```sh
docker compose --profile workers up -d --build --scale reports-worker=3
docker compose ps reports-worker
docker compose logs -f reports-worker
```

`docker compose ps` should list three `reports-worker` containers. Each log says `report worker started`.

Create several reports quickly:

```sh
for i in 1 2 3 4 5 6; do
  curl -sS -X POST http://localhost:3001/api/reports \
    -H 'content-type: application/json' \
    -d '{"reportType":"user-summary"}'
  echo
done
```

In the worker logs, different container names receive different `reportId` values. Redis gives each job to one worker. Bull Board can briefly show more than one job as `active`; the maximum with this setup is `3 containers × concurrency 2 = 6`.

Each ready report downloads through its own id:

```sh
curl -OJ http://localhost:3001/reports/<reportId>/download
```

The containers and the API share `./local-reports`, so a file written by any container is visible to the download route on your machine.

Stop the containers when you are finished:

```sh
docker compose --profile workers down
```

## Local development: one process for all workers

The existing development command starts both the demo and report workers:

```sh
pnpm --filter @repo/jobs dev
```

Root `pnpm dev` also runs this package command through Turbo.

This is convenient locally, but it does not isolate a heavy PDF/CSV report from lighter work. The report-only command exists for that:

```sh
pnpm --filter @repo/jobs dev:reports
```

Run this when you want to watch and debug only report generation.

## Containerized report worker

`Dockerfile.jobs` creates a worker image. `docker-compose.yml` has an opt-in `reports-worker` service that runs only the report entry point:

```sh
docker compose --profile workers up --build reports-worker
```

The worker receives container-specific connection addresses:

```text
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://postgres:postgres@postgresdb:5432/postgres
```

Inside Docker, `redis` and `postgresdb` are Compose service names. From your Mac, the same services use `localhost`.

## Scale report workers

Start three identical report-worker containers:

```sh
docker compose --profile workers up -d --build --scale reports-worker=3
```

Each container starts one report worker with `concurrency: 2`, so the maximum report processing capacity is:

```text
3 containers × 2 jobs per container = 6 reports at once
```

Redis distributes waiting jobs among the workers. No load balancer is needed for the workers because they pull jobs from the same queue.

Check the queue at [Bull Board](http://localhost:3001/queues). It will show waiting, active, completed, and failed jobs. The dashboard does not create workers; it only observes the queue.

## Choosing a safe concurrency

The actual bottleneck is usually PostgreSQL, PDF rendering CPU, or memory—not Redis.

Start conservatively:

```text
one container × concurrency 2
```

Measure:

- report duration;
- PostgreSQL CPU, connection count, and slow queries;
- worker CPU and memory;
- queue waiting time;
- failure/retry rate.

Then change one dimension at a time:

1. Increase worker `concurrency` from 2 to 3 or 4 if one container has idle CPU and memory.
2. Add another worker container if one process is saturated but PostgreSQL has capacity.
3. Reduce concurrency if normal API/database requests become slow.

For example, four containers at concurrency eight equals 32 simultaneous reports. That can be much worse than one container at concurrency two if each report performs an expensive query.

## Important local-file limitation

For this learning implementation, worker containers and the local API share `./local-reports` through a Docker bind mount:

```yaml
volumes:
  - ./local-reports:/app/local-reports
```

That lets a local worker write the CSV and the API download it from the same directory.

This is not a production file-storage design:

- A bind mount is tied to one development machine.
- Multiple hosts do not share their local disks.
- A container can be replaced and lose unmounted files.

When workers run across machines, write reports to private object storage instead. Store only the object key, file name, expiry, and status in PostgreSQL. On download, authorize the user again and issue a short-lived signed URL.

## Reliability and graceful shutdown

`packages/jobs/workers/reports.ts` listens for `SIGINT` and `SIGTERM`:

```ts
async function shutdown() {
  await worker.close();
}
```

Docker sends `SIGTERM` during stop or replacement. `worker.close()` stops taking new work and lets BullMQ release its resources safely. If a container dies mid-job, BullMQ detects the lost lock and can retry the job according to its configured attempts/backoff.

The report generator must be idempotent: it writes a deterministic file name based on `reportId` and updates one persistent report row. Retrying the same report should not create multiple logical report records.

## Production checklist

- [ ] Isolate heavy queues in their own worker entry points and deployments.
- [ ] Give workers only the Redis, database, and storage permissions they need.
- [ ] Use private object storage rather than local files.
- [ ] Add tenant/user authorization before queueing and downloading reports.
- [ ] Use a transactional outbox to prevent a report row being committed without its Redis job.
- [ ] Alert on queue depth, job age, worker failures, retries, CPU, memory, and database saturation.
- [ ] Load-test realistic report filters before increasing worker count.

The test walkthrough is in docs/worker-scaling.md. Run it in two terminals so you can see the API return before the worker creates the file.

1. Start Redis and Postgres

docker compose up -d redis postgresdb 2. Start only the API

Stop pnpm dev first. That command also starts a report worker, which makes the logs harder to follow.

pnpm --filter @repo/api dev 3. Start one report worker

pnpm --filter @repo/jobs dev:reports
Wait for report worker started and queue: report-generation.

4. Queue a report

curl -sS -X POST http://localhost:3001/api/reports \
 -H 'content-type: application/json' \
 -d '{"reportType":"user-summary"}'
The response is immediate and says queued. The worker terminal then logs report job received and report job completed.

5. Download it

curl -sS http://localhost:3001/api/reports/<reportId>
curl -OJ http://localhost:3001/reports/<reportId>/download
The status becomes ready. The CSV is also in local-reports/, and the job appears under report-generation at http://localhost:3001/queues.

6. See three workers share the queue

Stop the local worker with Ctrl+C, leave the API running, then:

docker compose --profile workers up -d --build --scale reports-worker=3
docker compose logs -f reports-worker
Create six reports:

for i in 1 2 3 4 5 6; do
curl -sS -X POST http://localhost:3001/api/reports \
 -H 'content-type: application/json' \
 -d '{"reportType":"user-summary"}'
echo
done
Different container names receive different report IDs. Redis gives each job to only one worker. Three containers with a concurrency of 2 can process up to six reports at once.
