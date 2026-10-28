import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { jobsRouter } from "./routes/jobs/route";
import { reportsRouter } from "./routes/reports/route";

export const serverRouter = router({
  health: healthRouter,
  authRouter: authRouter,
  jobs: jobsRouter,
  reports: reportsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
