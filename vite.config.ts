import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createSitemap } from 'vite-plugin-sitemap';
import sitemap from 'vite-plugin-pages-sitemap';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createSitemap({
      hostname: 'https://followuply.vercel.app',
      routes: [
        '/',
        '/login',
        '/signup',
        '/forgot-password',
        '/support',
        '/terms',
        '/privacy'
      ],
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0]
    }),
    sitemap({
      hostname: 'https://followuply.vercel.app',
      routes: [
        '/',
        '/login',
        '/signup',
        '/forgot-password',
        '/support',
        '/terms',
        '/privacy'
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
