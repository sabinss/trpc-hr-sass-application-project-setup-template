import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const reportStatusValues = ["queued", "processing", "ready", "failed"] as const;

export const reportsTable = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportType: varchar("report_type", { length: 80 }).notNull(),
  status: varchar("status", { length: 20, enum: reportStatusValues }).notNull().default("queued"),
  storageKey: varchar("storage_key", { length: 255 }),
  fileName: varchar("file_name", { length: 255 }),
  fileSizeBytes: integer("file_size_bytes"),
  failureMessage: varchar("failure_message", { length: 255 }),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export type SelectReport = typeof reportsTable.$inferSelect;
export type InsertReport = typeof reportsTable.$inferInsert;
