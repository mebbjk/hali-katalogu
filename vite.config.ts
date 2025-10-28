// FIX: Removed the explicit 'process' import and added a triple-slash directive to correctly load Node.js types, resolving the error with 'process.cwd()'.
/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ortam değişkenlerini .env dosyalarından yükle
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/hali-katalogu/',
    define: {
      // Ortam değişkenlerini istemci koduna sun
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
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
              src: 'icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
  }
});
