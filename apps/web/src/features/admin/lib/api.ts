import { headers } from "next/headers";
import { appRouter, createTRPCContext } from "@darchive/api";

export async function createServerCaller() {
  return appRouter.createCaller(await createTRPCContext({ headers: await headers() }));
}
