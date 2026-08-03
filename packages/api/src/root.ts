import { router } from "./trpc";
import { adminRouter } from "./routers/admin";
import { weddingRouter } from "./routers/wedding";

export const appRouter = router({
  admin: adminRouter,
  wedding: weddingRouter,
});

export type AppRouter = typeof appRouter;
