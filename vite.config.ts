import path from 'path';
import { defineConfig } from '@lark-apaas/fullstack-vite-preset';

const serverPort = process.env.SERVER_PORT || '3000';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
      },
      '/uploads': {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
      },
    },
  },
});
