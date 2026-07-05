import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { getCatalog } from "../api";

export function PlayPage({ gameId }: { gameId: string }) {
  const frameWrap = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const catalog = useQuery({ queryKey: ["catalog"], queryFn: getCatalog });

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

  if (catalog.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="aspect-video animate-pulse rounded-xl border border-line bg-panel" />
      </div>
    );
  }

  const game = catalog.data?.games.find((g) => g.id === gameId);

  if (catalog.isError || !game) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-lg font-bold text-txt">Couldn't open this game</h1>
        <p className="mt-2 text-sm text-mut">
          {catalog.isError ? (catalog.error as Error).message : "Game not found."}
        </p>
        <a
          href="#/"
          className="mt-6 inline-block rounded-lg border border-line px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.15em] text-mut hover:text-txt"
        >
          Back to the vault
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#/"
          className="rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-mut transition-colors hover:text-txt"
        >
          ← Vault
        </a>
        <h1 className="font-display text-lg font-bold text-txt">{game.name}</h1>
        <div className="ml-auto">
          <button
            onClick={toggleFullscreen}
            className="sheen metal-fill rounded-md px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.15em]"
          >
            {isFullscreen ? "Exit fullscreen" : "Fullscreen ⛶"}
          </button>
        </div>
      </div>
      <div
        ref={frameWrap}
        className="gold-frame mt-4 overflow-hidden rounded-xl bg-black"
        style={{ height: "min(75vh, 820px)" }}
      >
        <iframe
          src={game.url}
          title={game.name}
          className="h-full w-full border-0"
          allow="autoplay; fullscreen; gamepad; pointer-lock"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups"
        />
      </div>
      <p className="mt-3 text-xs text-mut">
        Game not loading? Some sites refuse to be embedded — tell Chezburger.
      </p>
    </div>
  );
}
