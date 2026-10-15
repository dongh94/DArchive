import { granvillePullbackStrategy } from "./granville-pullback";
import { sepaStrategy } from "./sepa";
import { turtleDarvasStrategy } from "./turtle-darvas";
import type { StrategyDefinition } from "./types";
import { volatilityBreakoutStrategy } from "./volatility-breakout";

export const STRATEGIES: StrategyDefinition[] = [
  sepaStrategy,
  turtleDarvasStrategy,
  granvillePullbackStrategy,
  volatilityBreakoutStrategy,
];
