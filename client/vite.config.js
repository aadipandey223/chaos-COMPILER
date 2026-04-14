import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/d3')) {
            return 'vendor-d3';
          }

          if (id.includes('/@uiw/react-codemirror')) {
            return 'vendor-editor-uiw';
          }

          if (id.includes('/@codemirror/lang-cpp') || id.includes('/@codemirror/lang-json')) {
            return 'vendor-editor-lang';
          }

          if (id.includes('/@codemirror/theme-one-dark')) {
            return 'vendor-editor-theme';
          }

          if (id.includes('/@codemirror/') || id.includes('/@lezer/') || id.includes('/codemirror/')) {
            return 'vendor-editor-core';
          }

          if (
            id.includes('/framer-motion') ||
            id.includes('/@react-spring/') ||
            id.includes('/react-intersection-observer')
          ) {
            return 'vendor-motion';
          }

          if (id.includes('/react-router-dom') || id.includes('/react-router')) {
            return 'vendor-router';
          }

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'vendor-react';
          }

          return 'vendor-misc';
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})
