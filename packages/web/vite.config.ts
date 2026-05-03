import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { localApiPlugin } from './vite-plugin-local-api';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix = load all env vars (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), '');
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        './runtimeConfig': './runtimeConfig.browser',
      },
    },
    plugins: [react(), tailwindcss(), localApiPlugin(env)],
  };
});
