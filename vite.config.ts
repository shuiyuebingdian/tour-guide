import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,webp,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.amap\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'amap-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: '随身导游',
        short_name: '导游',
        description: '走到哪讲到哪的旅游景点语音讲解',
        theme_color: '#1a73e8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [],
      },
    }),
  ],
});
