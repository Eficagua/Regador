import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Falls back to the local SQLite file from .env.example so the app boots without a configured env.
const datasourceUrl = process.env.DATABASE_URL || "file:./dev.db"

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
