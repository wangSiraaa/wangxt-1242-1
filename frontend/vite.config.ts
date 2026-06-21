import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const frontendPort = Number(process.env.FRONTEND_PORT || process.env.PORT || 5173);
  const backendPort = Number(process.env.BACKEND_PORT || 3001);

  return {
    plugins: [sveltekit()],
    server: {
      host: process.env.HOST || '0.0.0.0',
      port: frontendPort,
      proxy: {
        '/api': {
          target: process.env.VITE_API_TARGET || `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
