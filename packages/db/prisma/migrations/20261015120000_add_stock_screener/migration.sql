-- CreateEnum
CREATE TYPE "StockMarket" AS ENUM ('KOSPI', 'KOSDAQ');

-- CreateTable
CREATE TABLE "Stock" (
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "market" "StockMarket" NOT NULL,
    "sectorName" VARCHAR(100),
    "marketCap" BIGINT,
    "isCommonShare" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "DailyCandle" (
    "symbol" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "open" INTEGER NOT NULL,
    "high" INTEGER NOT NULL,
    "low" INTEGER NOT NULL,
    "close" INTEGER NOT NULL,
    "volume" BIGINT NOT NULL,

    CONSTRAINT "DailyCandle_pkey" PRIMARY KEY ("symbol","date")
);

-- CreateTable
CREATE TABLE "StrategyRun" (
    "id" TEXT NOT NULL,
    "strategyId" VARCHAR(40) NOT NULL,
    "asOfDate" DATE NOT NULL,
    "universeSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyPick" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "checks" JSONB NOT NULL,
    "rationale" VARCHAR(1000) NOT NULL,
    "levels" JSONB,

    CONSTRAINT "StrategyPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Stock_market_isActive_idx" ON "Stock"("market", "isActive");

-- CreateIndex
CREATE INDEX "DailyCandle_date_idx" ON "DailyCandle"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyRun_strategyId_asOfDate_key" ON "StrategyRun"("strategyId", "asOfDate");

-- CreateIndex
CREATE INDEX "StrategyPick_symbol_idx" ON "StrategyPick"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyPick_runId_rank_key" ON "StrategyPick"("runId", "rank");

-- AddForeignKey
ALTER TABLE "DailyCandle" ADD CONSTRAINT "DailyCandle_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Stock"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyPick" ADD CONSTRAINT "StrategyPick_runId_fkey" FOREIGN KEY ("runId") REFERENCES "StrategyRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyPick" ADD CONSTRAINT "StrategyPick_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Stock"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;

