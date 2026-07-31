// Local watch history — the "local data" that drives recommendations. Stored
// per-browser in localStorage; nothing leaves the device.
import type { YtVideo } from "./ytApi";

const KEY = "cbp_vid_hist";
const CAP = 60;

export type WatchEntry = {
  id: string;
  channelId: string;
  channel: string;
  title: string;
  thumb: string;
  t: number;
};

export function getHistory(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordWatch(v: YtVideo): void {
  try {
    const now = Date.now();
    const entry: WatchEntry = {
      id: v.id,
      channelId: v.channelId,
      channel: v.channel,
      title: v.title,
      thumb: v.thumb,
      t: now,
    };
    const rest = getHistory().filter((e) => e.id !== v.id);
    localStorage.setItem(KEY, JSON.stringify([entry, ...rest].slice(0, CAP)));
  } catch {
    // storage unavailable — recommendations just stay cold
  }
}

export function watchedIds(): Set<string> {
  return new Set(getHistory().map((e) => e.id));
}

// The channels the viewer watches most, most-recent-weighted, for the
// "Because you watched …" recommendation rows.
export function topChannels(n: number): { channelId: string; channel: string }[] {
  const score = new Map<string, { channel: string; score: number }>();
  const hist = getHistory();
  hist.forEach((e, i) => {
    if (!e.channelId) return;
    const prev = score.get(e.channelId);
    const weight = 1 + (hist.length - i) / hist.length; // recent watches weigh more
    score.set(e.channelId, {
      channel: e.channel,
      score: (prev?.score ?? 0) + weight,
    });
  });
  return [...score.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, n)
    .map(([channelId, v]) => ({ channelId, channel: v.channel }));
}

// ---- formatting helpers ----

export function fmtDuration(iso?: string): string {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso ?? "");
  if (!m) return "";
  const h = Number(m[1] ?? 0);
  const mn = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  const pad = (x: number) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${pad(mn)}:${pad(s)}` : `${mn}:${pad(s)}`;
}

export function fmtViews(v?: string): string {
  const n = Number(v);
  if (!n) return "";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B views`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M views`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K views`;
  return `${n} views`;
}

// Accept a pasted YouTube URL or bare id → the 11-char video id, so the search
// box can also just play any link.
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1, 12);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    // not a URL
  }
  return null;
}
