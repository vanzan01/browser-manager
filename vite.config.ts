import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    // Copy manifest.json and icons to build output
    copyPublicDir: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Define the public directory to include manifest and icons
  publicDir: 'public'
});
