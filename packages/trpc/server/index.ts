import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { jobsRouter } from "./routes/jobs/route";

export const serverRouter = router({
  health: healthRouter,
  authRouter: authRouter,
  jobs: jobsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
