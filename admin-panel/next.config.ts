import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",

  // ❌ NO basePath locally
  // ❌ NO assetPrefix locally
}

export default nextConfig
