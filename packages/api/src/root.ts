import { router } from "./trpc";
import { adminRouter } from "./routers/admin";
import { stocksRouter } from "./routers/stocks";
import { weddingRouter } from "./routers/wedding";

export const appRouter = router({
  admin: adminRouter,
  stocks: stocksRouter,
  wedding: weddingRouter,
});

export type AppRouter = typeof appRouter;
