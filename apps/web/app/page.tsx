'use client';
import { api } from "~/trpc/server";
import { trpc } from "~/trpc/client";

export default function Home() {
  // const { status } = await api.health.getHealth.query();
  // const { message } = await api.emsTest.query();
  const { data: message } = trpc.emsTest.useQuery();
  console.log(message);
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1 className="text-3xl">Streamyst - Stream in Style</h1>
        <h2>Server Status: {status}</h2>
        <h2>EMS Test: {message?.message}</h2>
      </div>
    </main>
  );
}
