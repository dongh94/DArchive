import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@darchive/api";

export type StocksOverview = inferRouterOutputs<AppRouter>["stocks"]["overview"];
export type StrategyMeta = StocksOverview["strategy"];
export type StrategyRunView = NonNullable<StocksOverview["run"]>;
export type TopPick = StrategyRunView["picks"][number];
