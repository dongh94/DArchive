export type Region = "kr" | "us";
export type Side = "buy" | "sell";

export type ScreenerParams = {
  region: Region;
  side: Side;
  strategy?: string;
  sector?: string;
  date?: string;
};

export const STOCK_PAGE_PATH = "/projects/stock";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseScreenerParams(raw: Record<string, string | string[] | undefined> | undefined): ScreenerParams {
  const pick = (key: string) => {
    const value = raw?.[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };
  const date = pick("date");

  return {
    region: pick("region") === "us" ? "us" : "kr",
    side: pick("side") === "sell" ? "sell" : "buy",
    strategy: pick("strategy"),
    sector: pick("sector"),
    date: date && ISO_DATE_PATTERN.test(date) ? date : undefined,
  };
}

/** Builds a page link; changing region, side or strategy resets the sector and date filters. */
export function screenerHref(current: ScreenerParams, next: Partial<ScreenerParams>) {
  const resetsFilters = next.region !== undefined || next.side !== undefined || next.strategy !== undefined;
  const merged: ScreenerParams = {
    ...current,
    ...(resetsFilters ? { sector: undefined, date: undefined } : {}),
    ...next,
  };
  const query = new URLSearchParams();

  if (merged.region !== "kr") query.set("region", merged.region);
  if (merged.side !== "buy") query.set("side", merged.side);
  if (merged.strategy) query.set("strategy", merged.strategy);
  if (merged.sector) query.set("sector", merged.sector);
  if (merged.date) query.set("date", merged.date);

  const search = query.toString();
  return search ? `${STOCK_PAGE_PATH}?${search}` : STOCK_PAGE_PATH;
}
