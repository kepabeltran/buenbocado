/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@buenbocado/ui"],
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
