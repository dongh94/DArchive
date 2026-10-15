import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.DATABASE_POSTGRES_PRISMA_URL ?? process.env.DATABASE_POSTGRES_URL;

  return url?.replace("sslmode=require", "sslmode=no-verify");
}

export function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error("Database connection URL is not configured");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

export type { Prisma } from "./generated/prisma/client";
export {
  AfterPartyAttendance,
  MarketRegion,
  StockMarket,
  StrategySide,
  WeddingAttendance,
} from "./generated/prisma/enums";
