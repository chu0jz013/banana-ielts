/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('dexie')) return 'db';
            if (id.includes('ts-fsrs')) return 'srs';
            if (id.includes('react') || id.includes('scheduler/')) return 'react';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
