import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Server-side live manifest proxy plugin to bypass any browser CORS limitations
function gistProxyPlugin(): Plugin {
  const GIST_RAW_URL = 'https://gist.githubusercontent.com/zaibali12369-netizen/2364c4e55c216d7b3ad1cf676f3490e1/raw/Ai.txt';
  let cachedContent = '';
  let cacheTimestamp = 0;
  const CACHE_TTL_MS = 2000; // 2s live sync cache

  return {
    name: 'gist-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/apps', async (req, res) => {
        try {
          const now = Date.now();
          const force = req.url?.includes('force=true');

          if (!force && cachedContent && now - cacheTimestamp < CACHE_TTL_MS) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=15');
            res.end(cachedContent);
            return;
          }

          const response = await fetch(`${GIST_RAW_URL}?t=${now}`, {
            headers: { 'User-Agent': 'Neura-Vite-Proxy/1.0' }
          });

          if (!response.ok) {
            throw new Error(`Upstream Gist HTTP ${response.status}`);
          }

          const text = await response.text();
          cachedContent = text;
          cacheTimestamp = now;

          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(text);
        } catch (err: any) {
          if (cachedContent) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(cachedContent);
            return;
          }
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Failed to proxy Gist data' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gistProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
