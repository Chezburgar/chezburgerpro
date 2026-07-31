// Ultraviolet wiring. UV is a service-worker proxy: the SW (public/uv/sw.js)
// rewrites requests, and the actual network hop is made by a Wisp server that
// this page points bare-mux at. Everything below runs in the browser — the
// static site itself never proxies anything.

const BASE = import.meta.env.BASE_URL; // "/chezburgerpro/" on GitHub Pages
export const UV_PREFIX = `${BASE}uv/service/`;

export const WISP_SERVERS = [
  { label: "Mercury Workshop", url: "wss://wisp.mercurywork.shop/" },
  { label: "Anura", url: "wss://anura.pro/" },
] as const;

export const DEFAULT_WISP = WISP_SERVERS[0].url;
const WISP_KEY = "cbp_wisp";

export function getWispUrl(): string {
  try {
    return localStorage.getItem(WISP_KEY) || DEFAULT_WISP;
  } catch {
    return DEFAULT_WISP;
  }
}

export function setWispUrl(url: string): void {
  try {
    localStorage.setItem(WISP_KEY, url);
  } catch {
    // storage unavailable — applies for this visit only
  }
}

// UV's xor codec, matching Ultraviolet.codec.xor.encode exactly so the service
// worker can decode what we produce here.
export function encodeUrl(input: string): string {
  if (!input) return input;
  let out = "";
  for (let i = 0; i < input.length; i++) {
    out += i % 2 ? String.fromCharCode(input.charCodeAt(i) ^ 2) : input[i];
  }
  return encodeURIComponent(out);
}

// Turn whatever was typed into a real URL: bare domains get https://, anything
// that isn't a domain becomes a search.
export function normalizeInput(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const looksLikeDomain = /^[^\s/?#]+\.[a-z]{2,}([/?#].*)?$/i.test(s);
  if (looksLikeDomain) return `https://${s}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(s)}`;
}

export function proxiedUrl(target: string): string {
  return `${UV_PREFIX}${encodeUrl(target)}`;
}

type BareMuxConnectionLike = {
  setTransport: (path: string, options: unknown[]) => Promise<void>;
};

let connection: BareMuxConnectionLike | null = null;
let activeWisp: string | null = null;

async function getConnection(): Promise<BareMuxConnectionLike> {
  if (connection) return connection;
  const mod = (await import(/* @vite-ignore */ `${BASE}uv/baremux/index.mjs`)) as {
    BareMuxConnection: new (workerPath: string) => BareMuxConnectionLike;
  };
  connection = new mod.BareMuxConnection(`${BASE}uv/baremux/worker.js`);
  return connection;
}

/**
 * Register the UV service worker and point bare-mux at the chosen Wisp server.
 * Safe to call repeatedly; the transport is only re-set when the server changes.
 */
export async function startProxy(wisp: string): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser doesn't support service workers, so the proxy can't run.");
  }
  if (!window.isSecureContext) {
    throw new Error("The proxy needs a secure (https) connection.");
  }

  await navigator.serviceWorker.register(`${BASE}uv/sw.js`, { scope: UV_PREFIX });
  await navigator.serviceWorker.ready;

  if (activeWisp !== wisp) {
    const conn = await getConnection();
    await conn.setTransport(`${BASE}uv/epoxy/index.mjs`, [{ wisp }]);
    activeWisp = wisp;
  }
}
