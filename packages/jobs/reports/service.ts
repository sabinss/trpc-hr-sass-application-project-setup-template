import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, count, eq } from "@repo/database";
import { reportsTable, usersTable } from "@repo/database/schema";

const reportDirectory = path.resolve(__dirname, "..", "..", "..", "local-reports");

export async function createDemoReport() {
  const [report] = await db
    .insert(reportsTable)
    .values({ reportType: "user-summary" })
    .returning({ id: reportsTable.id });

  if (!report) throw new Error("Report record was not created");
  return report;
}

export async function getReport(reportId: string) {
  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, reportId));
  return report ?? null;
}

export async function generateReport(reportId: string) {
  const report = await getReport(reportId);
  if (!report) throw new Error("Report record not found");

  await db
    .update(reportsTable)
    .set({ status: "processing", startedAt: new Date(), failureMessage: null })
    .where(eq(reportsTable.id, reportId));

  if (report.reportType !== "user-summary") {
    throw new Error(`Unsupported report type: ${report.reportType}`);
  }

  const [userSummary] = await db.select({ totalUsers: count() }).from(usersTable);
  const storageKey = `user-summary-${reportId}.csv`;
  const contents = [
    "metric,value",
    `generated_at,${new Date().toISOString()}`,
    `registered_user_count,${userSummary?.totalUsers ?? 0}`,
  ].join("\n");
  const filePath = getReportFilePath(storageKey);

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(filePath, `${contents}\n`, "utf8");
  const file = await stat(filePath);

  await db
    .update(reportsTable)
    .set({
      status: "ready",
      storageKey,
      fileName: "user-summary.csv",
      fileSizeBytes: file.size,
      completedAt: new Date(),
      failureMessage: null,
    })
    .where(eq(reportsTable.id, reportId));

  return { reportId, storageKey };
}

export async function markReportFailed(reportId: string) {
  await db
    .update(reportsTable)
    .set({
      status: "failed",
      failureMessage: "Generation failed. Retry the report.",
    })
    .where(eq(reportsTable.id, reportId));
}

export async function getReportDownload(reportId: string) {
  const report = await getReport(reportId);
  if (!report || report.status !== "ready" || !report.storageKey || !report.fileName) return null;

  return {
    fileName: report.fileName,
    filePath: getReportFilePath(report.storageKey),
  };
}

function getReportFilePath(storageKey: string) {
  const safeStorageKey = path.basename(storageKey);
  if (safeStorageKey !== storageKey) throw new Error("Invalid report storage key");
  return path.join(reportDirectory, safeStorageKey);
}
