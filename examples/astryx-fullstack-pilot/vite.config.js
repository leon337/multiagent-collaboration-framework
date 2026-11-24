import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
