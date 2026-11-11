/*
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

*/


import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Configuration de Vite pour React et FastAPI.
export default defineConfig({
  plugins: [react()],

  server: {
    // Port du frontend React.
    port: 5173,

    // Évite de changer automatiquement de port.
    strictPort: true,

    // Transmet les routes statistiques vers FastAPI.
    proxy: {
      '/statistics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});

