// Client for the ChezburgerPRO YouTube proxy (a Supabase Edge Function that
// holds the API key server-side and caches responses). The publishable key
// below is safe to expose — it only identifies the project's API gateway.

const YT_BASE = "https://bgoxonxxutkporbqbtbh.supabase.co/functions/v1/yt";
const YT_ANON = "sb_publishable_HtWG15aHqfYe2gFNbhTfjQ_gy86rIWU";

export type YtVideo = {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  thumb: string;
  publishedAt?: string;
  duration?: string;
  /** Length in seconds — present on enriched results (/shorts, /videos, /popular). */
  seconds?: number;
  /** YouTube category id; "10" is Music. */
  categoryId?: string;
  views?: string;
};

// In-memory cache so a card the user just saw can hand its metadata to the
// watch page without another round trip.
const seen = new Map<string, YtVideo>();
export function remember(videos: YtVideo[]): void {
  for (const v of videos) seen.set(v.id, v);
}
export function recall(id: string): YtVideo | undefined {
  return seen.get(id);
}

async function ytCall(path: string, params: Record<string, string | number>): Promise<YtVideo[]> {
  const u = new URL(`${YT_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== undefined && v !== null) u.searchParams.set(k, String(v));
  }
  const res = await fetch(u.toString(), { headers: { apikey: YT_ANON } });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(body?.error ?? `YouTube request failed (${res.status})`);
  }
  const items = (body.items ?? []) as YtVideo[];
  remember(items);
  return items;
}

export const ytPopular = (max = 24) => ytCall("/popular", { max });

export const ytSearch = (opts: {
  q?: string;
  channelId?: string;
  order?: "relevance" | "date" | "viewCount";
  duration?: "short" | "medium" | "long";
  max?: number;
}) =>
  ytCall("/search", {
    q: opts.q ?? "",
    channelId: opts.channelId ?? "",
    order: opts.order ?? "relevance",
    duration: opts.duration ?? "",
    max: opts.max ?? 24,
  });

export const ytVideos = (ids: string[]) =>
  ids.length ? ytCall("/videos", { ids: ids.join(",") }) : Promise.resolve([]);

/**
 * Genuinely short clips. YouTube's own "short" filter only means "under four
 * minutes", so the proxy enriches the results and keeps the ones that really
 * are short — dropping the Music category unless asked otherwise.
 */
export const ytShorts = (opts: {
  q?: string;
  channelId?: string;
  maxSeconds?: number;
  excludeMusic?: boolean;
  max?: number;
}) =>
  ytCall("/shorts", {
    q: opts.q ?? "",
    channelId: opts.channelId ?? "",
    maxSeconds: opts.maxSeconds ?? 90,
    excludeMusic: opts.excludeMusic === false ? "0" : "1",
    max: opts.max ?? 30,
  });
