import { useRef, useState } from "react";

const SCHOOL_URL = "https://chezburgar.github.io/";

export function SchoolPage() {
  const frameWrap = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-lg font-bold text-txt">
          School <span className="metal-text">desk</span>
        </h1>
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
        style={{ height: "min(78vh, 860px)" }}
      >
        <iframe
          src={SCHOOL_URL}
          title="School"
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
