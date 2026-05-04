import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { localApiPlugin } from './vite-plugin-local-api';
import { execSync } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix = load all env vars (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), '');

  let hasOllama = false;
  try {
    execSync('ollama --version', { stdio: 'ignore' });
    hasOllama = true;
  } catch (e) {
    hasOllama = false;
  }

  return {
    define: {
      'import.meta.env.VITE_APP_HAS_OPENAI_API_KEY': JSON.stringify(!!env.OPENAI_API_KEY),
      'import.meta.env.VITE_APP_HAS_ANTHROPIC_API_KEY': JSON.stringify(!!env.ANTHROPIC_API_KEY),
      'import.meta.env.VITE_APP_HAS_XAI_API_KEY': JSON.stringify(!!env.XAI_API_KEY),
      'import.meta.env.VITE_APP_HAS_OPENROUTER_API_KEY': JSON.stringify(!!env.OPENROUTER_API_KEY),
      'import.meta.env.VITE_APP_HAS_OLLAMA': JSON.stringify(hasOllama),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        './runtimeConfig': './runtimeConfig.browser',
      },
    },
    plugins: [react(), tailwindcss(), localApiPlugin(env)],
  };
});
