import { TRPCError } from "@trpc/server";
import { createDemoReport, enqueueReportGeneration, getReport } from "@repo/jobs";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  createReportInputModel,
  createReportOutputModel,
  getReportInputModel,
  getReportOutputModel,
} from "./model";

const TAGS = ["Reports"];
const getPath = generatePath("/reports");

export const reportsRouter = router({
  create: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath(""),
        tags: TAGS,
        summary: "Create a report generation request",
        description: "Queues a report and returns before the file is generated",
      },
    })
    .input(createReportInputModel)
    .output(createReportOutputModel)
    .mutation(async () => {
      const report = await createDemoReport();
      const { jobId } = await enqueueReportGeneration({ reportId: report.id });

      return {
        reportId: report.id,
        jobId,
        status: "queued",
      };
    }),
  get: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{reportId}"),
        tags: TAGS,
        summary: "Get report generation status",
      },
    })
    .input(getReportInputModel)
    .output(getReportOutputModel)
    .query(async ({ input }) => {
      const report = await getReport(input.reportId);
      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      return {
        id: report.id,
        reportType: report.reportType,
        status: report.status,
        fileName: report.fileName,
        fileSizeBytes: report.fileSizeBytes,
        failureMessage: report.failureMessage,
        requestedAt: report.requestedAt,
        startedAt: report.startedAt,
        completedAt: report.completedAt,
        downloadPath: report.status === "ready" ? `/reports/${report.id}/download` : null,
      };
    }),
});
