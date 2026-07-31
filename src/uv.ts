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
    localStorage.setItem(WISP_KEY, normalizeWisp(url));
  } catch {
    // storage unavailable — applies for this visit only
  }
}

/** Accept what people actually paste (https://x.onrender.com) → wss://x.onrender.com/ */
export function normalizeWisp(raw: string): string {
  let s = raw.trim();
  if (!s) return DEFAULT_WISP;
  s = s.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  if (!/^wss?:\/\//i.test(s)) s = `wss://${s}`;
  if (!s.endsWith("/")) s += "/";
  return s;
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

// Render's free tier sleeps after inactivity and takes ~30s to wake. Poke it
// over plain HTTP first so the WebSocket doesn't just time out on a cold box.
async function wakeRelay(wisp: string): Promise<void> {
  try {
    const http = wisp.replace(/^ws/i, "http");
    await withTimeout(
      fetch(http, { mode: "no-cors", cache: "no-store" }).then(() => undefined),
      45_000,
      "wake timeout",
    );
  } catch {
    // Best effort only — the real check is the WebSocket below.
  }
}

function waitForActivation(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return Promise.resolve();
  const worker = reg.installing ?? reg.waiting;
  if (!worker) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const onChange = () => {
      if (worker.state === "activated" || worker.state === "redundant") {
        worker.removeEventListener("statechange", onChange);
        resolve();
      }
    };
    worker.addEventListener("statechange", onChange);
    onChange();
  });
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
export async function startProxy(rawWisp: string): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser doesn't support service workers, so the proxy can't run.");
  }
  if (!window.isSecureContext) {
    throw new Error("The proxy needs a secure (https) connection.");
  }

  const wisp = normalizeWisp(rawWisp);

  // NOTE: do NOT use navigator.serviceWorker.ready here — it only resolves for a
  // worker controlling THIS page, and ours is scoped to /uv/service/, so it
  // would hang forever ("Opening tunnel…" that never finishes).
  const reg = await withTimeout(
    navigator.serviceWorker.register(`${BASE}uv/sw.js`, { scope: UV_PREFIX }),
    20_000,
    "Couldn't install the proxy service worker.",
  );
  await withTimeout(waitForActivation(reg), 20_000, "The proxy service worker didn't start.");

  if (activeWisp !== wisp) {
    await wakeRelay(wisp);
    const conn = await getConnection();
    await withTimeout(
      conn.setTransport(`${BASE}uv/epoxy/index.mjs`, [{ wisp }]),
      30_000,
      "The relay didn't respond. It may be asleep, down, or blocked on this network.",
    );
    activeWisp = wisp;
  }
}
