import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      // Copy the extension manifest to dist root so Chrome can load the build
      name: 'copy-manifest-json',
      writeBundle() {
        const src = resolve(__dirname, 'manifest.json');
        const dest = resolve(__dirname, '../dist/manifest.json');
        fs.copyFileSync(src, dest);
      }
    }
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'ui/popup.html'),
        'service-worker': resolve(__dirname, 'background/service-worker.ts'),
        'injected': resolve(__dirname, 'content-script/injected.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'service-worker') {
            return 'background/[name].js';
          }
          if (chunk.name === 'injected') {
            return 'content-script/[name].js';
          }
          return 'ui/[name]-[hash].js';
        },
        chunkFileNames: 'ui/[name]-[hash].js',
        assetFileNames: (asset) => {
          if (asset.name?.endsWith('.html')) {
            return 'ui/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@ui': resolve(__dirname, 'ui'),
      '@background': resolve(__dirname, 'background'),
      '@shared': resolve(__dirname, 'shared')
    }
  },
  define: {
    global: 'globalThis',
    // Polyfill Buffer for browser compatibility
    Buffer: 'undefined'
  }
});
