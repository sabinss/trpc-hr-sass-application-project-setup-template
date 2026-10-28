import { TRPCError } from "@trpc/server";
import { enqueueDemoJob, getDemoJob } from "@repo/jobs";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  enqueueDemoJobInputModel,
  enqueueDemoJobOutputModel,
  getDemoJobInputModel,
  getDemoJobOutputModel,
} from "./model";

const TAGS = ["Jobs"];
const getPath = generatePath("/jobs");

export const jobsRouter = router({
  enqueueDemo: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/demo"),
        tags: TAGS,
        summary: "Enqueue a demo job",
        description: "Adds a message to the demo BullMQ queue",
      },
    })
    .input(enqueueDemoJobInputModel)
    .output(enqueueDemoJobOutputModel)
    .mutation(async ({ input }) => {
      return enqueueDemoJob(input);
    }),
  getDemo: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{jobId}"),
        tags: TAGS,
        summary: "Get a demo job",
        description: "Returns the state and result of a demo BullMQ job",
      },
    })
    .input(getDemoJobInputModel)
    .output(getDemoJobOutputModel)
    .query(async ({ input }) => {
      const job = await getDemoJob(input.jobId);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demo job not found",
        });
      }
      return job;
    }),
});
