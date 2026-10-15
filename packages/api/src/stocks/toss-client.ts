const TOSS_BASE_URL = "https://openapi.tossinvest.com";
const MAX_ATTEMPTS = 5;

// Toss counts limits per client × API group. Stay a little under the published TPS so
// bursts from concurrent workers never trip a 429.
const GROUP_REQUESTS_PER_SECOND = {
  AUTH: 2,
  MARKET_DATA_CHART: 15,
  SECTOR: 4,
  STOCK_ALL: 1,
} as const;

type RateLimitGroup = keyof typeof GROUP_REQUESTS_PER_SECOND;

export type TossMarket = "KOSPI" | "KOSDAQ" | "NYSE" | "NASDAQ" | "AMEX";

export type TossMarketCountry = "KR" | "US";

export type TossListedStock = {
  symbol: string;
  name: string;
  securityType: string;
  isCommonShare: boolean;
  isinCode: string;
};

export type TossSector = {
  sectorId: string;
  name: string;
  depth: number;
  parentSectorId: string | null;
};

export type TossSectorStock = {
  symbol: string;
  name: string;
  marketCapitalization: string | null;
};

export type TossCandle = {
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
};

export type TossCandlePage = {
  candles: TossCandle[];
  nextBefore: string | null;
};

type TossErrorBody = {
  error?: {
    code?: string;
    message?: string;
    data?: { retryAfterSeconds?: number } | null;
  };
};

export class TossApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "TossApiError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createRateLimiter(requestsPerSecond: number) {
  const intervalMs = 1000 / requestsPerSecond;
  let nextSlot = 0;

  return async () => {
    const now = Date.now();
    const slot = Math.max(now, nextSlot);
    nextSlot = slot + intervalMs;

    if (slot > now) {
      await sleep(slot - now);
    }
  };
}

export function createTossClient({ clientId, clientSecret }: { clientId: string; clientSecret: string }) {
  const limiters = Object.fromEntries(
    Object.entries(GROUP_REQUESTS_PER_SECOND).map(([group, rps]) => [group, createRateLimiter(rps)]),
  ) as Record<RateLimitGroup, () => Promise<void>>;

  // Issuing a new token revokes the previous one, so a single process shares one token.
  let token: { value: string; expiresAt: number } | null = null;
  let pendingToken: Promise<string> | null = null;

  async function issueToken() {
    await limiters.AUTH();

    const response = await fetch(`${TOSS_BASE_URL}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new TossApiError(response.status, undefined, `Toss token request failed (${response.status}): ${await response.text()}`);
    }

    const body = (await response.json()) as { access_token: string; expires_in: number };
    token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };

    return token.value;
  }

  async function getToken() {
    if (token && token.expiresAt > Date.now()) {
      return token.value;
    }

    pendingToken ??= issueToken().finally(() => {
      pendingToken = null;
    });

    return pendingToken;
  }

  async function request<T>(group: RateLimitGroup, path: string, query: Record<string, string | number | boolean | undefined> = {}) {
    const url = new URL(path, TOSS_BASE_URL);

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    for (let attempt = 1; ; attempt += 1) {
      await limiters[group]();

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (response.ok) {
        return ((await response.json()) as { result: T }).result;
      }

      const body = (await response.json().catch(() => ({}))) as TossErrorBody;
      const code = body.error?.code;
      const canRetry = attempt < MAX_ATTEMPTS;

      if (response.status === 401 && canRetry) {
        token = null;
        continue;
      }

      if ((response.status === 429 || response.status >= 500) && canRetry) {
        const retryAfterSeconds =
          Number(response.headers.get("Retry-After")) || body.error?.data?.retryAfterSeconds || attempt;
        await sleep(retryAfterSeconds * 1000);
        continue;
      }

      throw new TossApiError(
        response.status,
        code,
        `Toss ${path} failed (${response.status} ${code ?? ""}): ${body.error?.message ?? response.statusText}`,
      );
    }
  }

  return {
    listStocks(market: TossMarket) {
      return request<TossListedStock[]>("STOCK_ALL", "/api/v1/stocks/all", {
        market,
        status: "ACTIVE",
        securityType: "STOCK",
      });
    },

    async listSectors() {
      return (await request<{ sectors: TossSector[] }>("SECTOR", "/api/v1/sectors")).sectors;
    },

    async listSectorStocks(sectorId: string, marketCountry: TossMarketCountry) {
      return (
        await request<{ stocks: TossSectorStock[] }>("SECTOR", `/api/v1/sectors/${encodeURIComponent(sectorId)}/stocks`, {
          marketCountry,
        })
      ).stocks;
    },

    /** Daily candles, newest first. */
    getDailyCandles(symbol: string, { count, before }: { count: number; before?: string }) {
      return request<TossCandlePage>("MARKET_DATA_CHART", "/api/v1/candles", {
        symbol,
        interval: "1d",
        count: Math.min(count, 200),
        before,
        adjusted: true,
      });
    },
  };
}

export type TossClient = ReturnType<typeof createTossClient>;
