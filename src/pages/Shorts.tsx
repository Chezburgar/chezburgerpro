import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { ytSearch, type YtVideo } from "../ytApi";
import { recordWatch, topChannels } from "../videoHistory";

export function ShortsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);

  const seed = topChannels(1)[0]?.channel;
  const shorts = useQuery({
    queryKey: ["yt", "shortsFeed", seed ?? "default"],
    queryFn: () => ytSearch({ q: seed ?? "shorts", duration: "short", max: 30 }),
    staleTime: 15 * 60_000,
  });

  const videos = shorts.data ?? [];

  // Autoplay whichever short is centered in the viewport.
  useEffect(() => {
    if (videos.length === 0) return;
    const root = containerRef.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-short-id]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const id = (e.target as HTMLElement).dataset.shortId ?? null;
            setActiveId(id);
          }
        }
      },
      { root, threshold: [0.6] },
    );
    slides.forEach((s) => io.observe(s));
    if (!activeId) setActiveId(videos[0].id);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.length]);

  // Record the active short as watched (feeds recommendations).
  useEffect(() => {
    const v = videos.find((x) => x.id === activeId);
    if (v) recordWatch(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <a
          href="#/videos"
          className="rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-mut transition-colors hover:text-txt"
        >
          ← Videos
        </a>
        <h1 className="font-display text-lg font-bold text-txt">
          <span className="metal-text">Shorts</span>
        </h1>
        <button
          onClick={() => setMuted((m) => !m)}
          className="ml-auto rounded-md border border-a3 px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-a1 transition-colors hover:bg-a3/20"
        >
          {muted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
      </div>

      {shorts.isPending ? (
        <p className="mt-10 text-center text-sm text-mut">Loading shorts…</p>
      ) : shorts.isError ? (
        <p className="mt-10 text-center text-sm text-mut">{(shorts.error as Error).message}</p>
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
                    key={`${v.id}-${muted ? "m" : "s"}`}
                    src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=${
                      muted ? 1 : 0
                    }&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${v.id}`}
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
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
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
