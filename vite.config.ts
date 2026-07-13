import path from 'path';
import { defineConfig } from 'vite';

const serverPort = process.env.SERVER_PORT || '3000';
const clientPort = Number(process.env.CLIENT_DEV_PORT || process.env.PORT || '5173');

const stripRuntimeInjectionPlugin = {
  name: 'strip-runtime-injection',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    const removed = html.replace(
      /<script[^>]*\bsrc\s*=\s*(?:"[^"]*\/@runtime\.js[^"]*"|'[^']*\/@runtime\.js[^']*')[^>]*><\/script>\s*/g,
      '',
    );
    return removed === html ? null : removed;
  },
  transform(code: string, id: string) {
    if (!/[/\\]client[/\\]src[/\\]index\.(tsx?|jsx?)$/.test(id)) {
      return null;
    }
    return null;
  },
};

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            if (
              id.includes('/node_modules/@tiptap') ||
              id.includes('/node_modules/tiptap')
            ) {
              return 'vendor-editor';
            }
            if (
              id.includes('/node_modules/@tanstack/react-query') ||
              id.includes('/node_modules/react-query')
            ) {
              return 'vendor-query';
            }
            if (id.includes('/node_modules/recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('/node_modules/@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('/node_modules/react-router-dom')) {
              return 'vendor-router';
            }
            if (id.includes('/node_modules/sonner')) {
              return 'vendor-sonner';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@client/src/',
        replacement: `${path.resolve(__dirname, 'client/src')}/`,
      },
      {
        find: '@/',
        replacement: `${path.resolve(__dirname, 'client/src')}/`,
      },
      {
        find: '@client',
        replacement: path.resolve(__dirname, 'client'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'client/src'),
      },
    ],
  },
  plugins: [stripRuntimeInjectionPlugin],
  server: {
    port: clientPort,
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
