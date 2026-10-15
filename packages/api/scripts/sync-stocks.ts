/**
 * Collects KOSPI/KOSDAQ and US large-cap daily candles from the Toss Securities Open API
 * and stores buy/sell strategy picks. Toss only accepts calls from allow-listed IPs, so this runs on
 * the owner's machine (manually or via launchd), never on Vercel.
 *
 *   pnpm stocks:sync                 incremental sync + strategies
 *   pnpm stocks:sync --limit 20      only the first 20 symbols per region (smoke test)
 *   pnpm stocks:sync --backfill      re-download 300 bars for every symbol
 *   pnpm stocks:sync --strategies-only
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { runStrategies } from "../src/stocks/run-strategies";
import { getCandleUniverse, syncCandles, syncSectors, syncStockList } from "../src/stocks/sync";
import { createTossClient } from "../src/stocks/toss-client";

const repoRoot = resolve(import.meta.dirname, "../../..");

for (const envFile of ["apps/web/.env.local", ".env.local", ".env"]) {
  const path = resolve(repoRoot, envFile);

  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}

const { values: options } = parseArgs({
  options: {
    backfill: { type: "boolean", default: false },
    limit: { type: "string" },
    "strategies-only": { type: "boolean", default: false },
  },
});

const log = (message: string) => console.log(`[${new Date().toLocaleTimeString("ko-KR", { hour12: false })}] ${message}`);

async function main() {
  const startedAt = Date.now();

  if (!options["strategies-only"]) {
    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("TOSS_CLIENT_ID and TOSS_CLIENT_SECRET must be set in .env.local");
    }

    const client = createTossClient({ clientId, clientSecret });
    await syncStockList(client, log);
    await syncSectors(client, log);

    const limit = options.limit ? Number.parseInt(options.limit, 10) : undefined;
    const universe = await getCandleUniverse();
    const stocks = limit
      ? [...Map.groupBy(universe, (stock) => stock.region).values()].flatMap((group) => group.slice(0, limit))
      : universe;
    await syncCandles(client, stocks, log, { backfill: options.backfill });
  }

  await runStrategies(log);
  log(`완료 (${Math.round((Date.now() - startedAt) / 1000)}초)`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { getPrisma } = await import("@darchive/db");
    await getPrisma().$disconnect();
  });
