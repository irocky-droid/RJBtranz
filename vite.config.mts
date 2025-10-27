import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'esnext',
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to reduce warnings
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts', 'd3'],
          utils: ['date-fns', 'uuid', 'clsx', 'tailwind-merge'],
          supabase: ['@supabase/supabase-js'],
          electron: ['electron'],
        },
      },
    },
  },
  server: {
    port: 5173, 
    strictPort: false,
  },
  // Ensure relative asset paths when packaged under Electron (file://)
  base: './',
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  preview: {
    allowedHosts: ['rjb-tranz-remittance.onrender.com']
  }
});
