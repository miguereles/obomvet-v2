import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa'; // <-- 1. IMPORTE O PLUGIN

export default defineConfig({
  plugins: [
    react(), 
    imagetools(),
    
    // 2. ADICIONE A CONFIGURAÇÃO DO PWA AQUI
    VitePWA({
      // Garante que o nome do arquivo seja 'sw.js'
      filename: 'sw.js',
      
      // Força o PWA a atualizar automaticamente
      registerType: 'autoUpdate', 

      // Configuração básica do manifest.json
      // (Você precisará ter esses ícones na sua pasta 'public')
      manifest: {
        name: 'oBomVet',
        short_name: 'oBomVet',
        description: 'Aplicação de veterinária oBomVet',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // Coloque este ícone na pasta /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Coloque este ícone na pasta /public
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  // (Suas configurações originais, estão corretas)
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});