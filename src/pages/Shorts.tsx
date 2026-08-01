import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ytShorts, type YtVideo } from "../ytApi";
import { recordWatch } from "../videoHistory";
import {
  blockedChannelIds,
  buildShortsQueries,
  clearReactions,
  dislikedIds,
  getReactions,
  likesMusic,
  reactionCounts,
  setReaction,
  type Reaction,
} from "../videoTaste";
import { playSound } from "../sound";

const SOUND_KEY = "cbp_shorts_sound";
const YT_ORIGIN = "https://www.youtube-nocookie.com";

function readSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

function ReactionButtons({
  reaction,
  onReact,
}: {
  reaction: Reaction | null;
  onReact: (r: Reaction) => void;
}) {
  const base =
    "flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-all active:scale-90";
  return (
    <div className="absolute right-3 bottom-24 z-10 flex flex-col gap-3">
      <button
        onClick={() => onReact("like")}
        aria-label={reaction === "like" ? "Remove like" : "Like"}
        title="More like this"
        className={`${base} ${
          reaction === "like"
            ? "metal-fill border-a2"
            : "border-white/25 bg-black/50 text-white hover:border-a2"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 22V10l5-8c1.3 0 2 .9 2 2v5h5.2a2 2 0 0 1 2 2.4l-1.6 8A2 2 0 0 1 17.6 22H7zM7 10H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill={reaction === "like" ? "currentColor" : "none"}
          />
        </svg>
      </button>
      <button
        onClick={() => onReact("dislike")}
        aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike"}
        title="Fewer like this"
        className={`${base} ${
          reaction === "dislike"
            ? "border-red-400 bg-red-500/80 text-white"
            : "border-white/25 bg-black/50 text-white hover:border-red-400"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M17 2v12l-5 8c-1.3 0-2-.9-2-2v-5H4.8a2 2 0 0 1-2-2.4l1.6-8A2 2 0 0 1 6.4 2H17zm0 12h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill={reaction === "dislike" ? "currentColor" : "none"}
          />
        </svg>
      </button>
    </div>
  );
}

export function ShortsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef(new Map<string, HTMLIFrameElement>());
  const settlingUntil = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(readSoundPref);
  // Bumped whenever a reaction changes, so the visible list re-filters.
  const [tasteTick, setTasteTick] = useState(0);
  // The searches are chosen once per visit; re-rolling them on every like would
  // yank the feed out from under you mid-scroll.
  const [queries, setQueries] = useState(buildShortsQueries);

  const results = useQueries({
    queries: queries.map((qq) => ({
      queryKey: ["yt", "shorts", qq.key],
      queryFn: () =>
        ytShorts({
          q: qq.q,
          channelId: qq.channelId,
          max: 30,
          excludeMusic: !likesMusic(),
        }),
      staleTime: 30 * 60_000,
    })),
  });

  const loading = results.some((r) => r.isPending);
  const failure = results.find((r) => r.isError)?.error as Error | undefined;

  // Interleave the sources so one topic can't dominate the top of the feed,
  // then drop anything you've already turned down.
  const videos = useMemo(() => {
    void tasteTick;
    const lists = results.map((r) => r.data ?? []);
    const banned = dislikedIds();
    const blockedChannels = blockedChannelIds();
    const seen = new Set<string>();
    const merged: YtVideo[] = [];
    const longest = Math.max(0, ...lists.map((l) => l.length));
    for (let i = 0; i < longest; i++) {
      for (const list of lists) {
        const v = list[i];
        if (!v || seen.has(v.id)) continue;
        if (banned.has(v.id) || blockedChannels.has(v.channelId)) continue;
        seen.add(v.id);
        merged.push(v);
      }
    }
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.dataUpdatedAt).join(","), tasteTick]);

  // Read reactions once per change rather than per slide — this list can be
  // long, and parsing storage inside the render loop showed up as jank.
  const reactionById = useMemo(() => {
    void tasteTick;
    return new Map(getReactions().map((r) => [r.id, r.reaction] as const));
  }, [tasteTick]);

  const command = useCallback((id: string, func: string, args: unknown[] = []) => {
    const frame = framesRef.current.get(id);
    frame?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      YT_ORIGIN,
    );
  }, []);

  // Keep the preference in sync when the viewer uses YouTube's OWN mute button.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN) return;
      if (Date.now() < settlingUntil.current) return;
      let data: { event?: string; info?: { muted?: boolean } };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data?.event !== "infoDelivery" || typeof data.info?.muted !== "boolean") return;
      const next = !data.info.muted;
      setSoundOn((prev) => {
        if (prev === next) return prev;
        try {
          localStorage.setItem(SOUND_KEY, next ? "on" : "off");
        } catch {
          // storage unavailable
        }
        return next;
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Autoplay whichever short is centered in the scroll container.
  useEffect(() => {
    if (videos.length === 0) return;
    const root = containerRef.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-short-id]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            setActiveId((e.target as HTMLElement).dataset.shortId ?? null);
          }
        }
      },
      { root, threshold: [0.6] },
    );
    slides.forEach((s) => io.observe(s));
    setActiveId((cur) => (cur && videos.some((v) => v.id === cur) ? cur : videos[0].id));
    return () => io.disconnect();
  }, [videos]);

  // Apply the audio preference to whichever short is playing.
  useEffect(() => {
    if (!activeId) return;
    settlingUntil.current = Date.now() + 3000;
    let tries = 0;
    const apply = () => {
      command(activeId, "listening");
      if (soundOn) {
        command(activeId, "unMute");
        command(activeId, "setVolume", [100]);
      } else {
        command(activeId, "mute");
      }
    };
    apply();
    const timer = setInterval(() => {
      apply();
      if (++tries >= 8) clearInterval(timer);
    }, 350);
    return () => clearInterval(timer);
  }, [activeId, soundOn, command]);

  useEffect(() => {
    const v = videos.find((x) => x.id === activeId);
    if (v) recordWatch(v);
  }, [activeId, videos]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // storage unavailable
    }
  };

  const react = (video: YtVideo, reaction: Reaction) => {
    const result = setReaction(video, reaction);
    playSound(result === "like" ? "success" : result === "dislike" ? "tap" : "toggle");
    // A dislike removes it from view; scroll on so you aren't left on a gap.
    if (result === "dislike" && video.id === activeId) {
      const idx = videos.findIndex((v) => v.id === video.id);
      const next = videos[idx + 1] ?? videos[idx - 1];
      if (next) setActiveId(next.id);
    }
    setTasteTick((n) => n + 1);
  };

  const counts = reactionCounts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#/videos"
          className="rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-mut transition-colors hover:text-txt"
        >
          ← Videos
        </a>
        <h1 className="font-display text-lg font-bold text-txt">
          <span className="metal-text">Shorts</span>
        </h1>
        <span className="hidden text-xs text-mut sm:inline">
          {counts.likes + counts.dislikes === 0
            ? "Like or skip to shape this feed"
            : `Tuned by ${counts.likes} like${counts.likes === 1 ? "" : "s"}, ${counts.dislikes} dislike${counts.dislikes === 1 ? "" : "s"}`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setQueries(buildShortsQueries());
              setTasteTick((n) => n + 1);
            }}
            className="rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-mut transition-colors hover:border-a3 hover:text-a1"
            title="Rebuild the feed from what you've liked"
          >
            Refresh feed
          </button>
          <button
            onClick={toggleSound}
            className="rounded-md border border-a3 px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-a1 transition-colors hover:bg-a3/20"
          >
            {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
          </button>
        </div>
      </div>

      {loading && videos.length === 0 ? (
        <p className="mt-10 text-center text-sm text-mut">Loading shorts…</p>
      ) : failure && videos.length === 0 ? (
        <p className="mt-10 text-center text-sm text-mut">{failure.message}</p>
      ) : videos.length === 0 ? (
        <div className="gold-frame mt-10 rounded-2xl bg-panel px-8 py-14 text-center">
          <h2 className="font-display text-lg font-bold text-txt">Nothing left in this feed</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-mut">
            You've turned down everything here. Refresh the feed for a new batch.
          </p>
          <button
            onClick={() => {
              setQueries(buildShortsQueries());
              setTasteTick((n) => n + 1);
            }}
            className="sheen metal-fill mt-6 rounded-lg px-6 py-2.5 font-display text-sm font-bold uppercase tracking-[0.2em]"
          >
            Refresh feed
          </button>
          {counts.dislikes > 0 && (
            <button
              onClick={() => {
                clearReactions();
                setQueries(buildShortsQueries());
                setTasteTick((n) => n + 1);
              }}
              className="mt-3 block w-full text-center font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut hover:text-a1"
            >
              Reset my taste
            </button>
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="no-scrollbar mt-4 snap-y snap-mandatory overflow-y-auto rounded-2xl"
          style={{ height: "calc(100dvh - 11rem)" }}
        >
          {videos.map((v: YtVideo) => (
            <div
              key={v.id}
              data-short-id={v.id}
              className="flex h-full snap-center items-center justify-center py-2"
            >
              <div
                className="gold-frame relative h-full overflow-hidden rounded-2xl bg-black"
                style={{ aspectRatio: "9 / 16", maxHeight: "100%" }}
              >
                {activeId === v.id ? (
                  <iframe
                    key={v.id}
                    ref={(el) => {
                      if (el) framesRef.current.set(v.id, el);
                      else framesRef.current.delete(v.id);
                    }}
                    src={`${YT_ORIGIN}/embed/${v.id}?autoplay=1&mute=1&enablejsapi=1&origin=${encodeURIComponent(
                      window.location.origin,
                    )}&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${v.id}`}
                    title={v.title}
                    className="h-full w-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={v.thumb || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-70"
                  />
                )}

                <ReactionButtons
                  reaction={reactionById.get(v.id) ?? null}
                  onReact={(r) => react(v, r)}
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pr-20">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{v.title}</p>
                  <p className="mt-1 text-xs text-white/70">{v.channel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
