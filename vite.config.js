import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/solo-leveling-v2/',
  build: {
    outDir: 'dist'
  }
});
