import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Database = unknown;

let prisma: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  // 优先尝试 Cloudflare D1 适配（生产环境）
  try {
    const { env } = getCloudflareContext();
    const db = (env as { DB?: D1Database }).DB;

    if (db) {
      const adapter = new PrismaD1({
        // 使用 Workers 提供的全局 fetch
        fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
        database: db,
      });

      return new PrismaClient({ adapter });
    }
  } catch {
    // 在本地开发或没有 Cloudflare 上下文时会走到这里，回退到默认 PrismaClient
  }

  // 本地开发：使用 DATABASE_URL / sqlite
  return new PrismaClient();
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}
