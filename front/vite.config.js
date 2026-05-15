import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [react(), mkcert()],
  build: {
    sourcemap: false,
  },
  server: {
    host: true, // Això fa que serveixi a la IP local
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3033',
        changeOrigin: false,
        secure: false,
      },
    },
  },
});
