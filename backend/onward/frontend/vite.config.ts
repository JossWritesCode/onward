import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Send API calls to the Rails server. Because the browser sees one origin,
    // the session cookie works without any CORS setup.
    proxy: {
      '/graphql': 'http://127.0.0.1:3000',
    },
  },
});
