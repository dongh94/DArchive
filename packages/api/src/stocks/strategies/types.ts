/** Daily bar, ordered oldest → newest inside a series. */
export type Bar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StrategyCheck = {
  key: string;
  label: string;
  passed: boolean;
  required: boolean;
  value: string;
  threshold: string;
};

export type StrategyLevels = {
  entry?: number;
  stop?: number;
  target?: number;
  note?: string;
};

export type StrategyEvaluation = {
  eligible: boolean;
  score: number;
  checks: StrategyCheck[];
  rationale: string;
  levels?: StrategyLevels;
};

export type Currency = "KRW" | "USD";

export type StrategyContext = {
  /** 0–99 percentile of 12-month weighted performance across the screened universe. */
  rsRating: number;
  currency: Currency;
};

export type StrategyId = "sepa" | "volatility-breakout" | "turtle-darvas" | "granville-pullback";

export type StrategySideRules = {
  summary: string;
  rules: string[];
  action: string;
  evaluate: (bars: Bar[], context: StrategyContext) => StrategyEvaluation;
};

export type StrategyDefinition = {
  id: StrategyId;
  name: string;
  author: string;
  source: string;
  minBars: number;
  buy: StrategySideRules;
  sell: StrategySideRules;
};
