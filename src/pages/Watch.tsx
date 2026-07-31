import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { recall, ytSearch, ytVideos, type YtVideo } from "../ytApi";
import { fmtViews, recordWatch } from "../videoHistory";

export function WatchPage({ videoId }: { videoId: string }) {
  // Metadata: use what we already have from the feed, else fetch it.
  const cached = recall(videoId);
  const meta = useQuery({
    queryKey: ["yt", "meta", videoId],
    queryFn: async () => (await ytVideos([videoId]))[0] ?? null,
    enabled: !cached,
    staleTime: 60 * 60_000,
  });
  const video: YtVideo | null = cached ?? meta.data ?? null;

  // Record the watch once we know the channel (drives recommendations).
  useEffect(() => {
    if (video) recordWatch(video);
  }, [video?.id, video?.channelId]);

  const upNext = useQuery({
    queryKey: ["yt", "upnext", video?.channelId ?? videoId],
    queryFn: () =>
      video?.channelId
        ? ytSearch({ channelId: video.channelId, order: "date", max: 16 })
        : ytSearch({ q: video?.title?.split(" ").slice(0, 4).join(" ") ?? "", max: 16 }),
    enabled: !!video,
    staleTime: 30 * 60_000,
  });

  const recommendations = (upNext.data ?? []).filter((v) => v.id !== videoId).slice(0, 12);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <a
        href="#/videos"
        className="inline-block rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-mut transition-colors hover:text-txt"
      >
        ← Videos
      </a>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="gold-frame overflow-hidden rounded-xl bg-black">
            <iframe
              key={videoId}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={video?.title ?? "Video"}
              className="aspect-video w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold leading-snug text-txt">
            {video?.title ?? "Now playing"}
          </h1>
          <p className="mt-1 text-sm text-mut">
            {video?.channel}
            {video?.views ? ` · ${fmtViews(video.views)}` : ""}
          </p>
        </div>

        <aside>
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-txt">
            Up next
          </h2>
          <div className="mt-4 space-y-3">
            {upNext.isPending && (
              <p className="text-sm text-mut">Finding more…</p>
            )}
            {recommendations.map((v) => (
              <a
                key={v.id}
                href={`#/watch/${v.id}`}
                data-sound="open"
                className="group flex gap-3"
              >
                <div className="w-36 shrink-0 overflow-hidden rounded-lg border border-line bg-panel2">
                  <img
                    src={v.thumb || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-txt group-hover:text-a1">
                    {v.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-mut">{v.channel}</p>
                </div>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
