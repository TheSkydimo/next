import { promises as fs } from "node:fs";
import path from "node:path";

// 原始 OpenNext 生成的 Worker 入口
const WORKER_SRC = path.join(".open-next", "worker.js");

// 对于 Cloudflare Pages，我们让构建输出目录指向 ".open-next/assets"
// 因此 _worker.js 也必须位于该目录的根部，才能作为 Functions 入口被识别。
const WORKER_DEST = path.join(".open-next", "assets", "_worker.js");

async function main() {
  try {
    await fs.access(WORKER_SRC);
  } catch {
    console.warn(
      "[build:cf] .open-next/worker.js not found, skip copying to assets/_worker.js.",
    );
    return;
  }

  // 确保目标目录存在（理论上 .open-next/assets 一定存在，但这里更稳妥）
  await fs.mkdir(path.dirname(WORKER_DEST), { recursive: true });

  await fs.copyFile(WORKER_SRC, WORKER_DEST);
  console.log(
    "[build:cf] Copied .open-next/worker.js -> .open-next/assets/_worker.js for Cloudflare Pages.",
  );
}

main().catch((err) => {
  console.error(
    "[build:cf] Failed to prepare assets/_worker.js for Cloudflare Pages:",
    err,
  );
  process.exitCode = 1;
});

