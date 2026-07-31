import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { ytSearch, type YtVideo } from "../ytApi";
import { recordWatch, topChannels } from "../videoHistory";

const SOUND_KEY = "cbp_shorts_sound";
const YT_ORIGIN = "https://www.youtube-nocookie.com";

function readSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

export function ShortsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef(new Map<string, HTMLIFrameElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  // The viewer's audio preference, remembered across shorts AND visits. Videos
  // always LOAD muted (browsers block autoplay with sound); we then unmute the
  // active one over the YouTube iframe API, so scrolling keeps your sound on.
  const [soundOn, setSoundOn] = useState(readSoundPref);

  const seed = topChannels(1)[0]?.channel;
  const shorts = useQuery({
    queryKey: ["yt", "shortsFeed", seed ?? "default"],
    queryFn: () => ytSearch({ q: seed ?? "shorts", duration: "short", max: 30 }),
    staleTime: 15 * 60_000,
  });

  const videos = shorts.data ?? [];

  // While we are pushing our preference onto a freshly mounted player, ignore
  // its own mute reports — every short loads muted, so those would otherwise
  // flip the preference straight back off.
  const settlingUntil = useRef(0);

  const command = useCallback((id: string, func: string, args: unknown[] = []) => {
    const frame = framesRef.current.get(id);
    frame?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      YT_ORIGIN,
    );
  }, []);

  // Keep the preference in sync when the viewer uses YouTube's OWN mute button
  // inside the player, so their choice still carries to the next short.
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
          // storage unavailable — preference applies for this visit only
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
    setActiveId((cur) => cur ?? videos[0].id);
    return () => io.disconnect();
  }, [videos.length]);

  // Apply the audio preference to whichever short is playing. The player
  // ignores commands until it is ready, so retry briefly after it mounts.
  useEffect(() => {
    if (!activeId) return;
    settlingUntil.current = Date.now() + 3000;
    let tries = 0;
    const apply = () => {
      // Ask the player to report its state back (drives the sync listener).
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

  // Record the active short as watched (feeds recommendations).
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
      // storage unavailable — preference applies for this visit only
    }
  };

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
          onClick={toggleSound}
          className="ml-auto rounded-md border border-a3 px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-a1 transition-colors hover:bg-a3/20"
        >
          {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
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
                    // NOTE: the key must not depend on sound state — remounting
                    // would restart the video every time you toggle audio.
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
