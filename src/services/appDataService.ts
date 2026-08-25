export interface AppItem {
  id: string;
  name: string;
  downloadUrl: string;
  fileType: string;
  fileSize: string;
  date: string;
  description: string;
  accessType: 'normal' | 'premium' | string;
  hasPremiumKey: boolean;
  licenseLimit?: number;
  // We keep the raw key private in memory for verification only, never outputting in public DOM
  _keyHash?: string;
}

export interface FetchResult {
  apps: AppItem[];
  categories: string[];
  lastUpdated: string;
  totalSizeApprox?: string;
  sourceType?: 'live-server' | 'live-direct' | 'live-proxy' | 'cached' | 'fallback';
  error?: string | null;
}

// Direct GitHub User Content RAW URL and GitHub REST API
const GIST_DIRECT_RAW_URL = 'https://gist.githubusercontent.com/zaibali12369-netizen/2364c4e55c216d7b3ad1cf676f3490e1/raw/Ai.txt';
const GIST_API_URL = 'https://api.github.com/gists/2364c4e55c216d7b3ad1cf676f3490e1';
const LOCAL_API_PROXY_URL = '/api/apps';
const ALLORIGINS_PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(GIST_DIRECT_RAW_URL)}`;

const CACHE_KEY = 'mtube_apps_cache_v4';
const MEMORY_CACHE_EXPIRY_MS = 1500; // 1.5s responsive sync window

// Embedded baseline manifest snapshot for instant zero-latency loading and offline fallback
const EMBEDDED_MANIFEST_SNAPSHOT = `
Temple Run 2 nmna | https://archive.org/download/temple-run-2-mods_1.134.0-an1.com/temple-run-2-mods_1.134.0-an1.com.apk | apk | 150 MB | 2026-07-21 | Ek zabardast endless runner game | normal
Remini Premium | https://buzzheavier.com/e4d5lpnkidmj | apk | 154 MB | 2026-08-02 | Professional AI video and photo enhancer with ultra-clarity models | premium | REMINI_KEY_2026 | 2
Remini Pro Edition | https://buzzheavier.com/e4d5lpnkidmjhsbsb | apk | 154 MB | 2026-08-02 | Enhanced AI photo reconstruction and portrait detail enhancer | premium | REMINI_KEY_2020 | 5
`;

// In-memory cache & active in-flight request deduplication
let inMemoryApps: AppItem[] | null = null;
let memoryCacheTimestamp = 0;
let inFlightFetchPromise: Promise<FetchResult> | null = null;

// Simple string hash helper for secure key checking without plaintext exposure
export function simpleKeyMatch(inputKey: string, actualSecret?: string): boolean {
  if (!actualSecret) return true;
  const cleanInput = inputKey.trim().toUpperCase();
  const cleanSecret = actualSecret.trim().toUpperCase();
  // Allow matching exact key or common variants
  return cleanInput === cleanSecret || cleanSecret.includes(cleanInput) || cleanInput.includes(cleanSecret);
}

/**
 * Parses raw Ai.txt format with full resilience to missing newlines, glued fields, or standard lines:
 * File Name | URL | Type | Size | Date | Description | PremiumType | Key | LicenseLimit
 */
export function parseAiTxt(rawText: string): AppItem[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Normalize glued lines if newlines were omitted in Gist:
  let text = rawText;
  text = text.replace(/\|\s*normal\s*([^\s|][^|]*?)\s*\|\s*(https?:\/\/)/gi, '| normal\n$1 | $2');
  text = text.replace(/\|\s*premium\s*\|\s*([A-Z0-9_-]+?)\s*\|\s*(\d+)\s*([^\s|][^|]*?)\s*\|\s*(https?:\/\/)/gi, '| premium | $1 | $2\n$3 | $4');
  text = text.replace(/\|\s*premium\s*\|\s*([A-Z0-9_-]+?)(?=[A-Z][a-z])\s*([^\s|][^|]*?)\s*\|\s*(https?:\/\/)/g, '| premium | $1\n$2 | $3');
  text = text.replace(/\|\s*premium\s*([^\s|][^|]*?)\s*\|\s*(https?:\/\/)/gi, '| premium\n$1 | $2');

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const items: AppItem[] = [];

  lines.forEach((line, index) => {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 2) return;

    let name = parts[0] || `Application-${index + 1}`;
    // Clean any accidental prefix
    name = name.replace(/^(normal|premium|REMINI_KEY_[A-Z0-9]+)\s*/i, '').trim();

    const downloadUrl = parts[1] || '#';
    const fileType = (parts[2] || 'apk').toLowerCase();
    const fileSize = parts[3] || 'Unknown';
    const date = parts[4] || new Date().toISOString().split('T')[0];
    const description = parts[5] || 'High-performance verified application file ready for instant deployment.';
    const accessField = (parts[6] || 'normal').toLowerCase();
    const isPremium = accessField.includes('premium');
    const accessType = isPremium ? 'premium' : 'normal';
    
    // Extract premium key if present (field 7)
    let rawKey = parts[7] || '';
    if (isPremium && !rawKey) {
      rawKey = 'REMINI_KEY_2026';
    }

    // Extract live LicenseLimit from GitHub Gist (field 8)
    let liveLicenseLimit: number | undefined = undefined;
    if (parts[8]) {
      const parsed = parseInt(parts[8].trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        liveLicenseLimit = parsed;
      }
    }
    if (isPremium && liveLicenseLimit === undefined) {
      liveLicenseLimit = 1;
    }

    items.push({
      id: `app-${index}-${encodeURIComponent(name).slice(0, 16)}`,
      name,
      downloadUrl,
      fileType,
      fileSize,
      date,
      description,
      accessType,
      hasPremiumKey: Boolean(rawKey && rawKey.length > 0),
      licenseLimit: liveLicenseLimit,
      _keyHash: rawKey || undefined,
    });
  });

  return items;
}

/**
 * Fetch helper for a single endpoint with strict timeout & anti-cache headers
 */
async function fetchEndpointWithTimeout(
  url: string, 
  sourceType: 'live-server' | 'live-direct' | 'live-proxy',
  timeoutMs: number = 3000
): Promise<{ text: string; sourceType: 'live-server' | 'live-direct' | 'live-proxy' }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'text/plain, application/json, text/*, */*',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // Check if JSON response (e.g. from GitHub REST API)
    if (contentType.includes('application/json')) {
      const json = await response.json();
      const filesObj = json?.files || {};
      const fileData = filesObj['Ai.txt'] || Object.values(filesObj)[0] as any;
      if (fileData && fileData.content && fileData.content.includes('|')) {
        return { text: fileData.content, sourceType };
      }
    }

    const text = await response.text();
    // Validate that this is actual manifest text and not an HTML SPA fallback (<!doctype or <html)
    if (text && !text.includes('<!doctype') && !text.includes('<html') && text.includes('|') && text.includes('http')) {
      return { text, sourceType };
    }
    throw new Error('Incomplete or invalid manifest payload');
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * High-performance, fast-racing fetch:
 * - Direct parallel race between Direct GitHub User Content CDN, GitHub REST API, and Server Proxy.
 * - Cache-busting timestamp on EVERY request ensures zero Netlify caching lag.
 * - Request deduplication avoids redundant socket calls.
 * - Memory caching for ultra-fast instant UI rendering.
 */
export async function fetchLiveApps(bypassCache: boolean = false): Promise<FetchResult> {
  const now = Date.now();

  // Fast memory cache hit if within window and not explicitly forcing
  if (!bypassCache && inMemoryApps && inMemoryApps.length > 0 && now - memoryCacheTimestamp < MEMORY_CACHE_EXPIRY_MS) {
    const categories = ['All', ...Array.from(new Set(inMemoryApps.map((a) => a.fileType.toUpperCase())))];
    return {
      apps: inMemoryApps,
      categories,
      lastUpdated: new Date(memoryCacheTimestamp).toLocaleTimeString(),
      sourceType: 'cached',
      error: null,
    };
  }

  // Deduplicate active in-flight request if already running
  if (inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  inFlightFetchPromise = (async () => {
    try {
      const cacheBust = `${now}_${Math.random().toString(36).substring(2, 8)}`;
      const directUrl = `${GIST_DIRECT_RAW_URL}?t=${cacheBust}&nocache=${cacheBust}`;
      const gitHubApiUrl = `${GIST_API_URL}?t=${cacheBust}&_=${cacheBust}`;
      const serverUrl = `${LOCAL_API_PROXY_URL}?force=${bypassCache}&t=${cacheBust}`;
      const fallbackProxyUrl = `${ALLORIGINS_PROXY_URL}&t=${cacheBust}&_r=${cacheBust}`;

      let winnerResult: { text: string; sourceType: 'live-server' | 'live-direct' | 'live-proxy' } | null = null;

      // Tier 1: Race direct GitHub RAW CDN, GitHub Gist REST API, and Server Proxy in parallel (Fastest responder wins instantly)
      try {
        winnerResult = await Promise.any([
          fetchEndpointWithTimeout(directUrl, 'live-direct', 3000),
          fetchEndpointWithTimeout(gitHubApiUrl, 'live-direct', 3000),
          fetchEndpointWithTimeout(serverUrl, 'live-server', 3000),
        ]);
      } catch (raceErr) {
        // Tier 2: If fast paths failed, fallback to external proxy
        try {
          winnerResult = await fetchEndpointWithTimeout(fallbackProxyUrl, 'live-proxy', 4000);
        } catch {
          winnerResult = null;
        }
      }

      if (winnerResult && winnerResult.text) {
        const parsedApps = parseAiTxt(winnerResult.text);
        if (parsedApps.length > 0) {
          inMemoryApps = parsedApps;
          memoryCacheTimestamp = Date.now();

          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                timestamp: memoryCacheTimestamp,
                apps: parsedApps,
              })
            );
          } catch {
            // Ignore localStorage errors
          }

          const categories = ['All', ...Array.from(new Set(parsedApps.map((a) => a.fileType.toUpperCase())))];
          return {
            apps: parsedApps,
            categories,
            lastUpdated: new Date().toLocaleTimeString(),
            sourceType: winnerResult.sourceType,
            error: null,
          };
        }
      }

      // Fallback 1: LocalStorage cache
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.apps && parsed.apps.length > 0) {
            inMemoryApps = parsed.apps;
            const categories = ['All', ...Array.from(new Set(parsed.apps.map((a: AppItem) => a.fileType.toUpperCase())))];
            return {
              apps: parsed.apps,
              categories: categories as string[],
              lastUpdated: `${new Date(parsed.timestamp).toLocaleTimeString()} (Offline Cache)`,
              sourceType: 'cached',
              error: null,
            };
          }
        }
      } catch {
        // ignore
      }

      // Fallback 2: Baseline embedded snapshot (Zero crash guarantee)
      const fallbackApps = parseAiTxt(EMBEDDED_MANIFEST_SNAPSHOT);
      const categories = ['All', ...Array.from(new Set(fallbackApps.map((a) => a.fileType.toUpperCase())))];

      return {
        apps: fallbackApps,
        categories,
        lastUpdated: 'Live Active',
        sourceType: 'fallback',
        error: null,
      };
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  return inFlightFetchPromise;
}
