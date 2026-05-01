import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/f1-score/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'F1 Score',
        short_name: 'F1 Score',
        description: 'Mobile-first Formula 1 live timing, schedule, standings and track viewer.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0b0b0d',
        theme_color: '#0b0b0d',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://api.openf1.org',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openf1-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://api.jolpi.ca',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'jolpica-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 6 }
            }
          }
        ]
      }
    })
  ]
});
