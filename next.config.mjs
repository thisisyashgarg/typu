/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["curlconverter", "web-tree-sitter"],
    // tree-sitter loads its native binaries via a dynamic path that file tracing misses
    outputFileTracingIncludes: {
      "/api/curl": ["./node_modules/tree-sitter*/prebuilds/**"],
    },
  },
};

export default nextConfig;
