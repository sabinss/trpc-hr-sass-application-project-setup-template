import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";

export const healthRouter = router({
  getHealth: publicProcedure
    .meta({ openapi: { method: "GET", path: "/health" } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        status: z.literal("healthy").describe("status of the server"),
      }),
    )
    .query(async () => {
      return {
        status: "healthy",
      };
    }),
  emsHealthCheck: publicProcedure
    .input(
      z.object({
        message: z.string().describe("message to be sent to the ems"),
      }),
    )
    .output(
      z.object({
        message: z.string().describe("message from the ems"),
      }),
    )
    .query(async (ctx) => {
      console.log(ctx.input);
      return {
        message: "Message" + ctx.input.message,
      };
    }),
});
