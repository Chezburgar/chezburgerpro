import { useEffect, useState } from "react";

import { Monogram } from "./Monogram";

// Quick vault-opening animation that plays over the top of the app on each
// full page load, then fades out and unmounts. Skipped under reduced-motion.
export function IntroOverlay() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div className="intro-overlay fixed inset-0 z-[100] flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="intro-ring absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="var(--a3)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          </svg>
          <div className="intro-seal">
            <Monogram size={104} ring={false} />
          </div>
        </div>
        <p className="intro-word mt-7 font-display text-sm font-bold uppercase text-txt">
          Chezburger<span className="metal-text">PRO</span>
        </p>
      </div>
    </div>
  );
}
