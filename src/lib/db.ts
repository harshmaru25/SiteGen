import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var` declarations
  var prisma: PrismaClient | undefined;
}

const db =
  global.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV === "development") {
  global.prisma = db;
}

export default db;