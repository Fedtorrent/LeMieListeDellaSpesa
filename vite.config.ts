import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Impostato su '/' come richiesto per la build web standard
  base: '/', 
  server: {
    host: true
  }
});