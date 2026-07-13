import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Static export for Hostinger Apache hosting — no Node.js server required
  output: 'export',
  trailingSlash: true,
  // Required for static export (Next.js built-in image optimisation needs a server)
  images: {
    unoptimized: true,
  },
  // Fix workspace root detection when there are multiple lockfiles
  outputFileTracingRoot: path.join(process.cwd()),
};

export default nextConfig;
