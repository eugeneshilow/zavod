import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  ...(process.env.GITHUB_PAGES === "true"
    ? { output: "export", basePath: "/zavod", trailingSlash: true }
    : {}),
};

export default nextConfig;
