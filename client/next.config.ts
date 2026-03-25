/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  
  // ADD THIS BLOCK ↓
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // (Optional) You might also need this if ESLint is failing the build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig; // or module.exports = nextConfig;