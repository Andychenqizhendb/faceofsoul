// Shared request guard: CORS allowlist, body-size cap, simple per-IP rate limit.
// No external dependencies. In-memory limiter works per Vercel function instance —
// adequate for MVP; swap for Upstash Ratelimit when scaling.

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://ai-fortune-master.vercel.app,https://faceofsoul.vercel.app,http://localhost:3456,http://localhost:3000')
  .split(',').map(s => s.trim()).filter(Boolean);

// Per-endpoint default limits (requests / windowMs per IP)
const DEFAULTS = {
  analyze: { max: 5,  windowMs: 60_000  },   // heavy: 5/min/IP
  chat:    { max: 20, windowMs: 60_000  },   // light
  daily:   { max: 10, windowMs: 60_000  },
};

// body-size caps (bytes)
const BODY_CAPS = {
  analyze: 6 * 1024 * 1024, // 6 MB — images get big
  chat:    32 * 1024,
  daily:   4  * 1024,
};

// Simple sliding-window counter; keyed by ip+endpoint
const buckets = new Map();

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function pickOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  // Fall back to first allowed origin — prevents wildcard CORS.
  return ALLOWED_ORIGINS[0] || 'null';
}

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', pickOrigin(req));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function checkRate(ip, endpoint) {
  const cfg = DEFAULTS[endpoint] || { max: 10, windowMs: 60_000 };
  const now = Date.now();
  const key = `${endpoint}:${ip}`;
  const arr = buckets.get(key) || [];
  // drop expired
  const fresh = arr.filter(t => now - t < cfg.windowMs);
  if (fresh.length >= cfg.max) {
    const retryAfter = Math.ceil((cfg.windowMs - (now - fresh[0])) / 1000);
    return { ok: false, retryAfter };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  // Opportunistic GC so the Map doesn't grow unbounded per instance
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.length || now - v[v.length - 1] > 10 * cfg.windowMs) buckets.delete(k);
    }
  }
  return { ok: true };
}

function checkBodySize(req, endpoint) {
  const cap = BODY_CAPS[endpoint] || 256 * 1024;
  const len = Number(req.headers['content-length'] || 0);
  if (len && len > cap) return { ok: false, cap };
  // Best-effort check against parsed body too
  if (req.body) {
    const size = typeof req.body === 'string'
      ? req.body.length
      : JSON.stringify(req.body).length;
    if (size > cap) return { ok: false, cap };
  }
  return { ok: true };
}

/**
 * guard(req, res, endpoint) -> true if request should proceed, false if already responded.
 * Endpoint is one of 'analyze' | 'chat' | 'daily'.
 */
export function guard(req, res, endpoint) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  const body = checkBodySize(req, endpoint);
  if (!body.ok) {
    res.status(413).json({ error: `Payload too large (cap ${body.cap} bytes)` });
    return false;
  }

  const ip = getIp(req);
  const rl = checkRate(ip, endpoint);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    res.status(429).json({ error: 'Too many requests', retryAfter: rl.retryAfter });
    return false;
  }

  return true;
}
