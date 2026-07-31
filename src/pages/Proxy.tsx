import { useEffect, useRef, useState } from "react";

import {
  WISP_SERVERS,
  getWispUrl,
  normalizeInput,
  normalizeWisp,
  proxiedUrl,
  setWispUrl,
  startProxy,
} from "../uv";
import { playSound } from "../sound";

type Status = "idle" | "starting" | "ready" | "error";

const QUICK_LINKS = [
  { label: "Google", url: "https://www.google.com" },
  { label: "YouTube", url: "https://m.youtube.com" },
  { label: "Wikipedia", url: "https://en.wikipedia.org" },
  { label: "Reddit", url: "https://www.reddit.com" },
  { label: "Discord", url: "https://discord.com/app" },
];

export function ProxyPage() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [wisp, setWisp] = useState(getWispUrl);
  const [custom, setCustom] = useState("");
  const [showConn, setShowConn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameWrap = useRef<HTMLDivElement>(null);

  // Warm up the service worker + transport as soon as the page opens so the
  // first navigation isn't slow.
  useEffect(() => {
    let cancelled = false;
    setStatus("starting");
    setError(null);
    startProxy(wisp)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [wisp]);

  const go = async (raw: string) => {
    const url = normalizeInput(raw);
    if (!url) return;
    try {
      setError(null);
      setStatus("starting");
      await startProxy(wisp);
      setStatus("ready");
      playSound("open");
      setTarget(proxiedUrl(url));
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
      playSound("error");
    }
  };

  const toggleFullscreen = async () => {
    const el = frameWrap.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await el.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      setIsFullscreen(false);
    }
  };

  const pickServer = (url: string) => {
    const normalized = normalizeWisp(url);
    setWispUrl(normalized);
    setWisp(normalized); // re-runs the connect effect
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rise-in">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-mut">
          The side door
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-txt sm:text-4xl">
          <span className="metal-text">Proxy</span>
        </h1>

        <form
          className="relative mt-6 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            void go(input);
          }}
        >
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mut">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path
                d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a site or search…"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="w-full rounded-lg border border-line bg-panel py-2.5 pl-10 pr-20 text-sm text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2"
          />
          <button
            type="submit"
            className="sheen metal-fill absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.15em]"
          >
            Go
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {QUICK_LINKS.map((q) => (
            <button
              key={q.url}
              onClick={() => {
                setInput(q.url);
                void go(q.url);
              }}
              className="rounded-md border border-line px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-mut transition-colors hover:border-a3 hover:text-a1"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-2 text-mut">
            <span
              className={`block h-2 w-2 rounded-full ${
                status === "ready"
                  ? "bg-a2"
                  : status === "error"
                    ? "bg-red-500"
                    : "animate-pulse bg-a3"
              }`}
            />
            {status === "ready"
              ? "Tunnel ready"
              : status === "error"
                ? "Tunnel unavailable"
                : "Opening tunnel…"}
          </span>
          <button
            onClick={() => setShowConn((s) => !s)}
            className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:text-a1"
          >
            {showConn ? "Hide connection" : "Connection"}
          </button>
        </div>

        {error && (
          <p className="mt-2 max-w-xl text-xs text-red-400">
            {error} — try another relay under “Connection”.
          </p>
        )}

        {showConn && (
          <div className="gold-frame mt-4 max-w-xl rounded-xl bg-panel p-4">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Relay server
            </p>
            <p className="mt-2 text-xs leading-relaxed text-mut">
              Pages are fetched through a public Wisp relay. Traffic to the site is encrypted in
              your browser, so the relay only forwards it — but it is someone else's server, and
              relays go down often. Swap if one stops working.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WISP_SERVERS.map((s) => (
                <button
                  key={s.url}
                  onClick={() => pickServer(s.url)}
                  className={`rounded-md border px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                    wisp === s.url
                      ? "border-a2 text-a1"
                      : "border-line text-mut hover:border-a3 hover:text-txt"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                const v = custom.trim();
                if (v) pickServer(v);
              }}
            >
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
                Or your own Wisp server
              </span>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="https://chezburgerpro-relay.onrender.com"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-txt outline-none focus:border-a2"
                />
                <button
                  type="submit"
                  className="sheen metal-fill shrink-0 rounded-md px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.15em]"
                >
                  Use
                </button>
              </div>
              <p className="mt-2 font-mono text-[10px] text-mut">Active: {wisp}</p>
            </form>
          </div>
        )}
      </div>

      {target && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-txt">
              Browsing
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
            <button
              onClick={() => setTarget(null)}
              className="rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-mut transition-colors hover:text-txt"
            >
              Close
            </button>
            <button
              onClick={toggleFullscreen}
              className="sheen metal-fill rounded-md px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.15em]"
            >
              {isFullscreen ? "Exit fullscreen" : "Fullscreen ⛶"}
            </button>
          </div>
          <div
            ref={frameWrap}
            className="gold-frame mt-4 overflow-hidden rounded-xl bg-black"
            style={{ height: "min(78vh, 900px)" }}
          >
            <iframe
              src={target}
              title="Proxy"
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; clipboard-write; encrypted-media"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-xs text-mut">
            Some sites refuse to load in a frame — use fullscreen, or try the mobile version of the
            site.
          </p>
        </div>
      )}
    </div>
  );
}
