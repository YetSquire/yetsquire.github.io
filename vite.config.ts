import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/ytimg': {
        target: 'https://i.ytimg.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ytimg/, ''), // -> /vi/<ID>/hqdefault.jpg
        // Optional: add CORS header on the proxied response
        // (types for 'configure' aren't exported; 'any' keeps TS happy)
        configure: (proxy: any) => {
          proxy.on('proxyRes', (proxyRes: any) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          });
        },
      },
    },
  },
});
