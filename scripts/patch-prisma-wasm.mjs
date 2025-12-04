import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prisma Cloudflare WASM engine loader file
const TARGET_PATH = path.join(
  __dirname,
  "..",
  "app",
  "generated",
  "prisma",
  "internal",
  "class.ts",
);

async function main() {
  let source;
  try {
    source = await fs.readFile(TARGET_PATH, "utf8");
  } catch (error) {
    console.warn(
      "[patch-prisma-wasm] Skip: cannot read Prisma client file:",
      error instanceof Error ? error.message : String(error),
    );
    return;
  }

  const startMarker = "config.engineWasm = {";
  const endMarker = "config.compilerWasm";

  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker, startIndex === -1 ? 0 : startIndex);

  if (startIndex === -1 || endIndex === -1) {
    console.warn(
      "[patch-prisma-wasm] Skip: engineWasm block not found or Prisma version/layout changed.",
    );
    return;
  }

  const before = source.slice(0, startIndex);
  const after = source.slice(endIndex);

  const replacement = `config.engineWasm = {
  getRuntime: async () => await import("./query_engine_bg.js"),

  getQueryEngineWasmModule: async () => {
    const base =
      (typeof globalThis !== "undefined" &&
        // @ts-ignore - global injected var in _worker.js
        globalThis.PRISMA_WASM_BASE_URL) ||
      (typeof process !== "undefined" &&
        typeof process.env !== "undefined" &&
        process.env.PRISMA_WASM_BASE_URL) ||
      undefined;

    let wasmUrlStr;

    if (base) {
      // Cloudflare Pages / Workers:
      // see \`scripts/prepare-pages-worker.mjs\` — we copy Prisma WASM into
      //   .open-next/assets/_next/static/prisma/query_engine_bg.wasm
      // so that it is publicly accessible at:
      //   https://<domain>/_next/static/prisma/query_engine_bg.wasm
      wasmUrlStr = new URL(
        "/_next/static/prisma/query_engine_bg.wasm",
        base,
      ).toString();
    } else {
      // 本地开发 / 其它环境：退回 Prisma 默认逻辑（由运行时自行解析 WASM）。
      // @ts-ignore
      const asset = new URL("./query_engine_bg.wasm", import.meta.url);
      const assetStr = typeof asset === "string" ? asset : asset.toString();

      wasmUrlStr = /^https?:\\/\\//i.test(assetStr)
        ? assetStr
        : assetStr.toString();
    }

    const response = await fetch(wasmUrlStr);
    if (!response.ok) {
      throw new Error(
        \`Failed to load Prisma query engine WASM from "\${wasmUrlStr}": \${response.status} \${response.statusText}\`
      );
    }

    const bytes = await response.arrayBuffer();
    return await WebAssembly.compile(bytes);
  },
}
`;

  const nextSource = before + replacement + after;

  await fs.writeFile(TARGET_PATH, nextSource, "utf8");
  console.log(
    "[patch-prisma-wasm] Patched Prisma engineWasm loader for Next.js / Cloudflare.",
  );
}

main().catch((error) => {
  console.error(
    "[patch-prisma-wasm] Failed to patch Prisma client:",
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exitCode = 1;
});
