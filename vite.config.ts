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

    const marker = "import '@lark-apaas/client-toolkit/runtime';";
    if (!code.includes(marker)) {
      return null;
    }

    return {
      code: code.split(marker).join(''),
      map: null,
    };
  },
};

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
  },
  resolve: {
    alias: [
      {
        find: '@client/compat/',
        replacement: `${path.resolve(__dirname, 'client/compat')}/`,
      },
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
