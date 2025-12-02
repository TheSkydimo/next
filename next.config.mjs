import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

// 仅在本地开发时模拟 Cloudflare 运行时（D1、环境变量等）
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}