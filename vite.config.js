import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // the Arena live preview is served from https://<port>-<sandbox>.e2b.app
    allowedHosts: ['.e2b.app', '.arena.ai', 'localhost'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.e2b.app', '.arena.ai', 'localhost'],
  },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
