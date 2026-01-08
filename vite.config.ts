import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    base: '/', // REQUIRED for Netlify

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      // Prevents "process is not defined" crash in browser
      'process.env': {}
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
