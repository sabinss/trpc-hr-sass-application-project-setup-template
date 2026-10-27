import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { publicProcedure } from "./trpc";

export const serverRouter = router({
  health: healthRouter,
  authRouter: authRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
