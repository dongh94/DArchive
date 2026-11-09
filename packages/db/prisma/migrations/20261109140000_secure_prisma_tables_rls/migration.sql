-- These tables are accessed through the trusted Prisma server, not the Data API.
-- No client policies: anon/authenticated must use the application's checked APIs.
ALTER TABLE public."DailyCandle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Stock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StrategyPick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StrategyRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WeddingGuestbookComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WeddingGuestbookEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WeddingPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WeddingRsvp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public."DailyCandle",
  public."Stock",
  public."StrategyPick",
  public."StrategyRun",
  public."WeddingGuestbookComment",
  public."WeddingGuestbookEntry",
  public."WeddingPhoto",
  public."WeddingRsvp",
  public."_prisma_migrations"
FROM PUBLIC, anon, authenticated;

