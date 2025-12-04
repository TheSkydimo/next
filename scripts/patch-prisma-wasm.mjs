import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 目标文件：Prisma 生成的 Cloudflare WASM Client
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

  const BASE_URL_LITERAL = process.env.PRISMA_WASM_BASE_URL ?? "";

  const replacement = `config.engineWasm = {
  getRuntime: async () => await import("./query_engine_bg.js"),

  getQueryEngineWasmModule: async () => {
    // NOTE:
    // The default Prisma Client for the \`cloudflare\` runtime imports
    // \`query_engine_bg.wasm?module\`, which causes Webpack (used by Next.js)
    // to parse the WASM binary. On some platforms this fails with:
    //
    //   "Module parse failed: Internal failure: parseVec could not cast the value"
    //
    // To avoid letting Webpack parse the binary at build time, we instead:
    //   1. Treat the WASM file as a plain asset using \`new URL(..., import.meta.url)\`
    //   2. Fetch its bytes at runtime
    //   3. Compile it with \`WebAssembly.compile\`
    //
    // This works in both Node.js (Next.js dev / build) and Cloudflare Workers,
    // and keeps the engine fully functional.

    // @ts-ignore - Webpack replaces this with a string URL to the emitted asset.
    const asset = new URL("./query_engine_bg.wasm", import.meta.url);

    const wasmUrl =
      typeof asset === "string"
        ? new URL(asset, "${BASE_URL_LITERAL}" || import.meta.url)
        : asset;

    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(
        \`Failed to load Prisma query engine WASM from "\${wasmUrl}": \${response.status} \${response.statusText}\`,
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


