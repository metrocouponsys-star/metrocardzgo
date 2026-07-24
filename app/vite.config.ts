import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Target modern browsers — smaller output (no IE11 polyfills)
    target: 'es2020',
    // Warn when any individual chunk exceeds 400KB gzipped
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Manual chunk splitting: each heavy dep gets its own async chunk.
        // The user only downloads what they actually use.
        manualChunks: (id: string) => {
          // Three.js ecosystem (~1.8MB raw) — only used on the landing page hero
          if (id.includes('three') || id.includes('@react-three')) {
            return 'vendor-three';
          }
          // Animation libs — framer-motion + gsap
          if (id.includes('framer-motion') || id.includes('gsap')) {
            return 'vendor-animation';
          }
          // Charts — only needed on /reports
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          // QR scanner — only needed on /members/search
          if (id.includes('html5-qrcode') || id.includes('zxing')) {
            return 'vendor-qr';
          }
          // PDF/image export — only needed for card/member export actions
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf';
          }
          // Supabase auth SDK
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Sentry — error tracking, loaded async after first interaction
          if (id.includes('@sentry')) {
            return 'vendor-sentry';
          }
          // Remaining node_modules go into a shared vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
});