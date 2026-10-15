-- Strategy results are recomputed by `pnpm stocks:sync`, so existing runs are dropped
-- instead of backfilling the new NOT NULL region/side/eligible columns.
DELETE FROM "StrategyRun";

-- CreateEnum
CREATE TYPE "MarketRegion" AS ENUM ('KR', 'US');

-- CreateEnum
CREATE TYPE "StrategySide" AS ENUM ('BUY', 'SELL');

-- AlterEnum
ALTER TYPE "StockMarket" ADD VALUE 'NYSE';
ALTER TYPE "StockMarket" ADD VALUE 'NASDAQ';
ALTER TYPE "StockMarket" ADD VALUE 'AMEX';

-- DropIndex
DROP INDEX "Stock_market_isActive_idx";

-- DropIndex
DROP INDEX "StrategyRun_strategyId_asOfDate_key";

-- AlterTable
ALTER TABLE "DailyCandle" ALTER COLUMN "open" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "high" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "low" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "close" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "region" "MarketRegion" NOT NULL DEFAULT 'KR';

-- AlterTable
ALTER TABLE "StrategyPick" ADD COLUMN     "eligible" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "StrategyRun" ADD COLUMN     "region" "MarketRegion" NOT NULL,
ADD COLUMN     "side" "StrategySide" NOT NULL;

-- CreateIndex
CREATE INDEX "Stock_region_isActive_idx" ON "Stock"("region", "isActive");

-- CreateIndex
CREATE INDEX "StrategyPick_runId_eligible_score_idx" ON "StrategyPick"("runId", "eligible", "score");

-- CreateIndex
CREATE INDEX "StrategyRun_asOfDate_idx" ON "StrategyRun"("asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyRun_strategyId_region_side_asOfDate_key" ON "StrategyRun"("strategyId", "region", "side", "asOfDate");
