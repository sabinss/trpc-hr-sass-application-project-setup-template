"use client";

import { trpc } from "~/trpc/client";

export default function Home() {
  const { data, isPending, isError, error } = trpc.healthRouter.getHealth.useQuery();
  const { data: ems } = trpc.healthRouter.emsHealthCheck.useQuery({ message: "Hello from Web" });
  console.log(ems);

  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1 className="text-3xl">EMS - Phase 2.0</h1>
        <h2>
          Server Status:{" "}
          {isPending ? "checking..." : isError ? `error - ${error.message}` : data.status}
        </h2>
      </div>
    </main>
  );
}
