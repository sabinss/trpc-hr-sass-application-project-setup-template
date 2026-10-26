import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { publicProcedure } from "./trpc";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  emsTest: publicProcedure.query(() => {
    return { message: "Message from EMS API" };
  }),
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
