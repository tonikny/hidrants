import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), mkcert(), tailwindcss()],
  build: {
    sourcemap: false,
  },
  server: {
    host: true, // Això fa que serveixi a la IP local
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3033',
        changeOrigin: false,
        secure: false,
      },
      '/tiles/osm': {
        target: 'https://tile.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles\/osm/, ''),
      },
      '/tiles/opentopo': {
        target: 'https://tile.opentopomap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles\/opentopo/, ''),
      },
      '/tiles/ign-raster': {
        target: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles\/ign-raster/, ''),
      },
      '/tiles/ign-orto': {
        target: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles\/ign-orto/, ''),
      },
    },
  },
});
