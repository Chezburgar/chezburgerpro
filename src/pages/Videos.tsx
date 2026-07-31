import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ytPopular, ytSearch, type YtVideo } from "../ytApi";
import { parseYouTubeId, topChannels } from "../videoHistory";
import { VideoCard, VideoRow } from "../components/VideoCard";
import { playSound } from "../sound";

function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="relative mt-6 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mut">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search YouTube, or paste a link…"
        className="w-full rounded-lg border border-line bg-panel py-2.5 pl-10 pr-24 text-sm text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2"
      />
      <button
        type="submit"
        className="sheen metal-fill absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.15em]"
      >
        Search
      </button>
    </form>
  );
}

function Grid({ videos }: { videos: YtVideo[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

function HomeFeed() {
  const channels = topChannels(2);

  const shorts = useQuery({
    queryKey: ["yt", "shorts"],
    queryFn: () => ytSearch({ q: "shorts", duration: "short", max: 16 }),
    staleTime: 30 * 60_000,
  });
  const trending = useQuery({
    queryKey: ["yt", "popular"],
    queryFn: () => ytPopular(24),
    staleTime: 30 * 60_000,
  });
  const rec1 = useQuery({
    queryKey: ["yt", "chan", channels[0]?.channelId],
    queryFn: () => ytSearch({ channelId: channels[0]!.channelId, order: "date", max: 12 }),
    enabled: !!channels[0],
    staleTime: 30 * 60_000,
  });
  const rec2 = useQuery({
    queryKey: ["yt", "chan", channels[1]?.channelId],
    queryFn: () => ytSearch({ channelId: channels[1]!.channelId, order: "date", max: 12 }),
    enabled: !!channels[1],
    staleTime: 30 * 60_000,
  });

  return (
    <>
      {shorts.data && shorts.data.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline gap-4">
            <h2 className="font-display text-lg font-bold text-txt">
              <span className="metal-text">Shorts</span>
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
            <a
              href="#/shorts"
              className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:text-a1"
            >
              Open feed →
            </a>
          </div>
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
            {shorts.data.slice(0, 12).map((v) => (
              <a
                key={v.id}
                href="#/shorts"
                data-sound="open"
                className="group w-32 shrink-0"
              >
                <div className="overflow-hidden rounded-xl border border-line bg-panel2">
                  <img
                    src={v.thumb || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="aspect-[9/16] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug text-txt">
                  {v.title}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {channels[0] && (
        <VideoRow title={`Because you watched ${channels[0].channel}`} videos={rec1.data ?? []} />
      )}
      {channels[1] && (
        <VideoRow title={`More from ${channels[1].channel}`} videos={rec2.data ?? []} />
      )}

      <section className="mt-10">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-lg font-bold text-txt">
            {channels.length ? "Trending" : "Recommended"}
          </h2>
          <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
        </div>
        {trending.isPending ? (
          <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-xl bg-panel2" />
                <div className="mt-2 h-3 w-3/4 rounded bg-panel2" />
              </div>
            ))}
          </div>
        ) : trending.isError ? (
          <p className="mt-6 text-sm text-mut">{(trending.error as Error).message}</p>
        ) : (
          <Grid videos={trending.data ?? []} />
        )}
      </section>
    </>
  );
}

export function VideosPage() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");

  const linkId = parseYouTubeId(input);

  const results = useQuery({
    queryKey: ["yt", "search", term],
    queryFn: () => ytSearch({ q: term, max: 32 }),
    enabled: term.length > 0,
    staleTime: 10 * 60_000,
  });

  const runSearch = () => {
    const id = parseYouTubeId(input);
    if (id) {
      playSound("open");
      window.location.hash = `#/watch/${id}`;
      return;
    }
    setTerm(input.trim());
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rise-in">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-mut">
          The screening room
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-txt sm:text-4xl">
          <span className="metal-text">Videos</span>
        </h1>
        <SearchBar value={input} onChange={setInput} onSubmit={runSearch} />
        {linkId && (
          <a
            href={`#/watch/${linkId}`}
            data-sound="open"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-a3 px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.15em] text-a1 transition-colors hover:bg-a3/20"
          >
            ▶ Play this link
          </a>
        )}
      </div>

      {term ? (
        <section className="mt-8">
          <div className="flex items-baseline gap-4">
            <h2 className="font-display text-lg font-bold text-txt">
              Results for “{term}”
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
            <button
              onClick={() => {
                setTerm("");
                setInput("");
              }}
              className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:text-a1"
            >
              Clear
            </button>
          </div>
          {results.isPending ? (
            <p className="mt-6 text-sm text-mut">Searching…</p>
          ) : results.isError ? (
            <p className="mt-6 text-sm text-mut">{(results.error as Error).message}</p>
          ) : results.data && results.data.length > 0 ? (
            <Grid videos={results.data} />
          ) : (
            <p className="mt-6 text-sm text-mut">No videos found. Try a different search.</p>
          )}
        </section>
      ) : (
        <HomeFeed />
      )}
    </div>
  );
}
