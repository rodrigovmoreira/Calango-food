import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  envDir: '../../', // Aponta para a raiz do monorepo para ler o .env
  server: {
    port: 5173
  }
});