import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  build: { outDir: 'dist' },
  plugins: [react()],
  resolve: {
    alias: { '@': path.join(rootDir, 'src') },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
