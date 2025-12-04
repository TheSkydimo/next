/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 让 Next.js 支持打包 Prisma Cloudflare Client 使用的 WASM（query_engine_bg.wasm?module）
  webpack(config) {
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;