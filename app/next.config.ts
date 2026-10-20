import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  experimental: { cpus: 2 },
  poweredByHeader: false,
};
export default config;
