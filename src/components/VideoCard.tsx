import type { YtVideo } from "../ytApi";
import { fmtDuration, fmtViews } from "../videoHistory";

export function VideoCard({ video }: { video: YtVideo }) {
  const dur = fmtDuration(video.duration);
  const views = fmtViews(video.views);
  return (
    <a
      href={`#/watch/${video.id}`}
      data-sound="open"
      className="group block"
    >
      <div className="relative overflow-hidden rounded-xl border border-line bg-panel2">
        <img
          src={video.thumb || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {dur && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-white">
            {dur}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-txt group-hover:text-a1">
        {video.title}
      </p>
      <p className="mt-1 truncate text-xs text-mut">
        {video.channel}
        {views ? ` · ${views}` : ""}
      </p>
    </a>
  );
}

// A horizontal "shelf" of cards under a titled header.
export function VideoRow({ title, videos }: { title: string; videos: YtVideo[] }) {
  if (videos.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-4">
        <h2 className="font-display text-lg font-bold text-txt">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
      </div>
      <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
        {videos.map((v) => (
          <div key={v.id} className="w-60 shrink-0">
            <VideoCard video={v} />
          </div>
        ))}
      </div>
    </section>
  );
}
