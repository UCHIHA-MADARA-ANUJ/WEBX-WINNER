import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",          // static site — hostable anywhere
  assetPrefix: "./",         // relative assets → works on any CDN path
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
