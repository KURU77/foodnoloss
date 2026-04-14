import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '食材管理アプリ',
        short_name: '食材管理',
        description: '食材の賞味期限をジャンルごとに管理するアプリ',
        theme_color: '#2d4a3e',
        background_color: '#f5f0e8',
        display: 'standalone',
        scope: '/foodnoloss/',
        start_url: '/foodnoloss/',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: '/foodnoloss/',
})
