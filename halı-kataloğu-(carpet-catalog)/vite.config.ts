import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/hali-katalogu/',
  define: {
    // Expose env variables from the build environment to the client
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}']
      },
      manifest: {
        name: 'Halı Kataloğu',
        short_name: 'Halılar',
        description: 'Yapay zeka destekli halı katalog uygulaması.',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/hali-katalogu/',
        start_url: '/hali-katalogu/',
        icons: [
          {
            src: 'carpet-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'carpet-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'carpet-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});