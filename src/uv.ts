// Ultraviolet wiring. UV is a service-worker proxy: the SW (public/uv/sw.js)
// rewrites requests, and the actual network hop is made by a Wisp server that
// this page points bare-mux at. Everything below runs in the browser — the
// static site itself never proxies anything.

const BASE = import.meta.env.BASE_URL; // "/chezburgerpro/" on GitHub Pages
export const UV_PREFIX = `${BASE}uv/service/`;

// Bump whenever the files under public/uv/ change. bare-mux loads the transport
// inside a SharedWorker, which outlives page reloads and keeps serving the
// module it first imported — so the URL itself has to change to force a fresh
// copy. (A stale epoxy build here is what kept throwing "headers is not
// iterable" long after the fix shipped.)
const ASSET_VERSION = "2";
const v = (path: string) => `${path}?v=${ASSET_VERSION}`;

export const WISP_SERVERS = [
  { label: "ChezburgerPRO", url: "wss://chezburgerpro-relay.onrender.com/" },
  { label: "Mercury Workshop", url: "wss://wisp.mercurywork.shop/" },
  { label: "Anura", url: "wss://anura.pro/" },
] as const;

/** Our own Render relay — nobody has to type it in. */
export const DEFAULT_WISP = WISP_SERVERS[0].url;
const WISP_KEY = "cbp_wisp";
const MIGRATED_KEY = "cbp_wisp_migrated";

// Public relays we used to default to before we ran our own. Anyone still
// pointed at one gets moved across once; a later explicit choice sticks.
const LEGACY_DEFAULTS = new Set(["wss://wisp.mercurywork.shop/", "wss://anura.pro/"]);

export function getWispUrl(): string {
  try {
    const saved = localStorage.getItem(WISP_KEY);
    if (!saved) return DEFAULT_WISP;
    const url = normalizeWisp(saved);
    // Devices that were pointed at a public relay back when that was the
    // default shouldn't stay stuck on it now that we run our own.
    if (LEGACY_DEFAULTS.has(url) && localStorage.getItem(MIGRATED_KEY) !== "1") {
      localStorage.setItem(MIGRATED_KEY, "1");
      localStorage.setItem(WISP_KEY, DEFAULT_WISP);
      return DEFAULT_WISP;
    }
    return url;
  } catch {
    return DEFAULT_WISP;
  }
}

export function setWispUrl(url: string): void {
  try {
    localStorage.setItem(WISP_KEY, normalizeWisp(url));
    // An explicit choice is final — don't migrate it away later.
    localStorage.setItem(MIGRATED_KEY, "1");
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
  const mod = (await import(/* @vite-ignore */ v(`${BASE}uv/baremux/index.mjs`))) as {
    BareMuxConnection: new (workerPath: string) => BareMuxConnectionLike;
  };
  connection = new mod.BareMuxConnection(v(`${BASE}uv/baremux/worker.js`));
  return connection;
}

/**
 * Tear down the proxy: drop the service worker, its caches, and the cached
 * transport. Used by the "Reset proxy" button so a stale worker can't keep
 * serving old code after an update.
 */
export async function resetProxy(): Promise<void> {
  connection = null;
  activeWisp = null;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => r.scope.includes("/uv/")).map((r) => r.unregister()));
  } catch {
    // nothing registered — nothing to clear
  }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    // Cache Storage unavailable
  }
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
    // updateViaCache: "none" makes the browser revalidate the worker and its
    // importScripts instead of serving them from the HTTP cache.
    navigator.serviceWorker.register(`${BASE}uv/sw.js`, {
      scope: UV_PREFIX,
      updateViaCache: "none",
    }),
    20_000,
    "Couldn't install the proxy service worker.",
  );
  void reg.update().catch(() => {});
  await withTimeout(waitForActivation(reg), 20_000, "The proxy service worker didn't start.");

  if (activeWisp !== wisp) {
    await wakeRelay(wisp);
    const conn = await getConnection();
    await withTimeout(
      conn.setTransport(v(`${BASE}uv/epoxy/index.mjs`), [{ wisp }]),
      30_000,
      "The relay didn't respond. It may be asleep, down, or blocked on this network.",
    );
    activeWisp = wisp;
  }
}
