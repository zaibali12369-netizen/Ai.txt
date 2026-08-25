import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const GIST_RAW_URL = 'https://gist.githubusercontent.com/zaibali12369-netizen/2364c4e55c216d7b3ad1cf676f3490e1/raw/Ai.txt';
let cachedContent = '';
let cacheTimestamp = 0;
// Low cache TTL (2 seconds) ensures near-instant propagation of Gist edits
const CACHE_TTL_MS = 2000;

app.use(express.json());

// Optimized API route to proxy Gist data seamlessly without browser CORS
app.get('/api/apps', async (req, res) => {
  try {
    const now = Date.now();
    const force = req.query.force === 'true';

    // Serve quick cache only if within 2s and not a forced refresh
    if (!force && cachedContent && now - cacheTimestamp < CACHE_TTL_MS) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=2');
      return res.send(cachedContent);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${GIST_RAW_URL}?t=${now}`, {
      headers: { 
        'User-Agent': 'MTube-Express-Proxy/1.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstream Gist HTTP ${response.status}`);
    }

    const text = await response.text();
    if (text && text.includes('|')) {
      cachedContent = text;
      cacheTimestamp = now;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(text || cachedContent);
  } catch (err: any) {
    if (cachedContent) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(cachedContent);
    }
    return res.status(502).json({ error: err?.message || 'Failed to fetch Gist data' });
  }
});

// Serve static assets from dist in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
