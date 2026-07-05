import { useEffect, useState } from "react";

function fmt(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/**
 * Live countdown to `expiresAt` (unix ms). `serverNow` (the server clock at
 * fetch time) corrects local clock drift. Calls `onExpire` once at zero.
 */
export function Countdown({
  expiresAt,
  serverNow,
  onExpire,
  className = "",
}: {
  expiresAt: number;
  serverNow?: number;
  onExpire?: () => void;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => expiresAt - (serverNow ?? Date.now()));

  useEffect(() => {
    const drift = serverNow ? serverNow - Date.now() : 0;
    let fired = false;
    const tick = () => {
      const left = expiresAt - (Date.now() + drift);
      setRemaining(left);
      if (left <= 0 && !fired) {
        fired = true;
        onExpire?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, serverNow, onExpire]);

  return (
    <span className={`font-mono tabular-nums tracking-wider ${className}`}>{fmt(remaining)}</span>
  );
}
