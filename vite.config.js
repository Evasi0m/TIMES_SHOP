import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed to GitHub Pages under the /TIMES_SHOP/ subpath.
export default defineConfig({
  base: '/TIMES_SHOP/',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
