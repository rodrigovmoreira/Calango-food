import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  envDir: '../../', // Aponta para a raiz do monorepo para ler o .env
  server: {
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});