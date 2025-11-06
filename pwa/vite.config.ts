import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa'; 

export default defineConfig({
  plugins: [
    react(), 
    imagetools(), 
    VitePWA({  // <-- Chave de abertura
      registerType: 'autoUpdate',
      strategies: 'injectManifest', 
      srcSW: 'sw.ts', //
    }) // <-- Chave de fechamento
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://obomvet.onrender.com/api',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});