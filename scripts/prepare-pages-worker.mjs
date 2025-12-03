import { promises as fs } from "node:fs";
import path from "node:path";

const WORKER_SRC = path.join(".open-next", "worker.js");
const WORKER_DEST = path.join(".open-next", "_worker.js");

async function main() {
  try {
    await fs.access(WORKER_SRC);
  } catch {
    console.warn(
      "[build:cf] .open-next/worker.js not found, skip copying to _worker.js.",
    );
    return;
  }

  await fs.copyFile(WORKER_SRC, WORKER_DEST);
  console.log(
    "[build:cf] Copied .open-next/worker.js -> .open-next/_worker.js for Cloudflare Pages.",
  );
}

main().catch((err) => {
  console.error("[build:cf] Failed to prepare _worker.js for Cloudflare Pages:", err);
  process.exitCode = 1;
});


