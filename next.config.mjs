import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev({
  // 与 wrangler 本地状态目录保持一致，便于在 next dev 时访问 D1 等绑定
  persist: { path: ".wrangler/state" },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
};

export default nextConfig;

