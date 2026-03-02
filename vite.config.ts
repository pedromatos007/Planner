import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (.env)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Adicionei os plugins corretamente aqui
    plugins: [react(), tailwindcss()],
    
    base: '/',

    define: {
      // Define a chave da API para ser usada no projeto
      // Certifique-se de que no seu .env o nome seja exatamente GEMINI_API_KEY
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        // Ajustado para apontar para a raiz ou pasta src, conforme o padrão
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      // Desativa HMR se a variável DISABLE_HMR for true
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
