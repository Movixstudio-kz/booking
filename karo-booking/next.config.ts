import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static output lets GitHub Pages host the Next.js application without a server.
  output: "export",
  basePath: "/booking",
  trailingSlash: true,
};

export default nextConfig;
