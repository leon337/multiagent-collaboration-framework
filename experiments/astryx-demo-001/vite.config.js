import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 41782,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    cssCodeSplit: false,
  },
});
