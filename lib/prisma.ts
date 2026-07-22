import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __prismaGlobal?: PrismaClient };

export const prisma = globalForPrisma.__prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prismaGlobal = prisma;
}
