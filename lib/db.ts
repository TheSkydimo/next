// lib/db.ts
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// Cloudflare Pages/Workers provides `env` at runtime; declare for TS
interface D1Database {}
declare const env: { DB: D1Database };

// 在 Node.js 本地构建 / 运行时，`env` 不存在；在 Cloudflare Workers 中由平台注入。
// 使用 typeof 检查可以避免在 Next 构建阶段访问未定义的全局变量导致 ReferenceError。
const hasD1Env =
  typeof env !== "undefined" &&
  !!(env as { DB?: D1Database }).DB;

const adapter = hasD1Env
  ? new PrismaD1({
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args), // Workers' global fetch
      database: (env as { DB: D1Database }).DB,
    })
  : undefined;

export const prisma = new PrismaClient(adapter ? { adapter } : undefined);