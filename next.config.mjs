/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["curlconverter", "web-tree-sitter"],
  },
};

export default nextConfig;
