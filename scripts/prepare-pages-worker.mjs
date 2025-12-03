import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = ".open-next";
// Cloudflare Pages 的构建输出目录（见 wrangler.json 的 pages_build_output_dir）
const PAGES_ROOT = path.join(ROOT, "assets");

// 原始 OpenNext 生成的 Worker 入口
const WORKER_SRC = path.join(ROOT, "worker.js");
// Pages Functions 入口，必须位于构建输出目录根部
const WORKER_DEST = path.join(PAGES_ROOT, "_worker.js");

// 为了让 wrangler 在 Pages 模式下正确打包 _worker.js，
// 需要把它依赖的 runtime 目录一并复制过去（保持相对路径不变）。
const RUNTIME_DIRS = [
  "cloudflare",
  "middleware",
  "server-functions",
  ".build",
];

async function copyRuntimeDir(dir) {
  const src = path.join(ROOT, dir);
  const dest = path.join(PAGES_ROOT, dir);

  try {
    await fs.access(src);
  } catch {
    // 某些目录（例如 .build / durable-objects）在未启用相关特性时可能不存在
    return;
  }

  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  try {
    await fs.access(WORKER_SRC);
  } catch {
    console.warn(
      "[build:cf] .open-next/worker.js not found, skip preparing Cloudflare Pages bundle.",
    );
    return;
  }

  // 确保目标目录存在
  await fs.mkdir(PAGES_ROOT, { recursive: true });

  // 复制 worker 入口
  await fs.copyFile(WORKER_SRC, WORKER_DEST);

  // 复制运行时依赖目录
  await Promise.all(RUNTIME_DIRS.map((dir) => copyRuntimeDir(dir)));

  console.log(
    "[build:cf] Prepared Cloudflare Pages bundle in .open-next/assets (worker + runtime).",
  );
}

main().catch((err) => {
  console.error(
    "[build:cf] Failed to prepare Cloudflare Pages bundle in .open-next/assets:",
    err,
  );
  process.exitCode = 1;
});

