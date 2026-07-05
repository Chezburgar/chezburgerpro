import { useState } from "react";

import { applyTheme, savedThemeId, THEMES, type Theme } from "../themes";
import { useAccess } from "../access-context";
import { Countdown } from "../components/Countdown";
import { isSoundOn, playSound, setSoundOn } from "../sound";

// A miniature preview of the real ChezburgerPRO UI, painted in the theme's own
// colors — a gold seal + title, a metallic button, and body lines.
function ThemeSwatch({
  theme,
  active,
  onPick,
}: {
  theme: Theme;
  active: boolean;
  onPick: () => void;
}) {
  const [bg, panel, panel2, line, text, mut, a1, a2, a3, ink] = theme.v;
  const gold = `linear-gradient(150deg, ${a1}, ${a2} 55%, ${a3})`;
  return (
    <button
      onClick={onPick}
      data-sound="toggle"
      className={`group rounded-xl border p-2 text-left transition-all hover:-translate-y-0.5 ${
        active ? "border-a2 shadow-[0_0_0_1px_var(--a2)]" : "border-line hover:border-a3"
      }`}
      style={{ background: panel }}
    >
      <div
        className="overflow-hidden rounded-lg border p-2.5"
        style={{ background: bg, borderColor: line }}
      >
        {/* masthead: seal + title bar */}
        <div className="flex items-center gap-1.5">
          <span
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ background: gold, boxShadow: `0 0 0 1px ${line}` }}
          />
          <span className="h-1.5 w-11 rounded-full" style={{ background: text, opacity: 0.9 }} />
          <span className="ml-auto h-1.5 w-4 rounded-full" style={{ background: a2 }} />
        </div>
        {/* a "game card" tile with a metallic button */}
        <div
          className="mt-2 rounded-md p-1.5"
          style={{ background: panel2, boxShadow: `inset 0 0 0 1px ${line}` }}
        >
          <div className="flex items-center justify-center rounded" style={{ height: 18, background: bg }}>
            <span className="text-[9px] font-bold" style={{ color: a2 }}>
              ▶
            </span>
          </div>
          <div className="mt-1.5 rounded-sm" style={{ height: 6, background: gold }}>
            <span className="block text-center text-[5px] font-bold leading-[6px]" style={{ color: ink }}>
              PLAY
            </span>
          </div>
        </div>
        {/* body lines */}
        <div className="mt-2 space-y-1">
          <span className="block h-1 w-full rounded-full" style={{ background: mut, opacity: 0.55 }} />
          <span className="block h-1 w-2/3 rounded-full" style={{ background: mut, opacity: 0.4 }} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between px-0.5">
        <p className="truncate text-xs font-semibold" style={{ color: text }}>
          {theme.name}
        </p>
        <span
          className="ml-2 shrink-0 font-display text-[9px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: active ? a2 : mut }}
        >
          {active ? "On" : theme.light ? "Light" : "Dark"}
        </span>
      </div>
    </button>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        on ? "border-a2" : "border-line bg-panel2"
      }`}
      style={on ? { background: "linear-gradient(150deg, var(--a1), var(--a2) 55%, var(--a3))" } : undefined}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${on ? "left-[22px]" : "left-0.5"}`}
        style={{ background: on ? "var(--ink)" : "var(--mut)" }}
      />
    </button>
  );
}

export function SettingsPage() {
  const access = useAccess();
  const [themeId, setThemeId] = useState(savedThemeId);
  const [sound, setSound] = useState(isSoundOn);

  const pickTheme = (id: string) => {
    setThemeId(id);
    applyTheme(id);
  };

  const toggleSound = (on: boolean) => {
    setSound(on);
    setSoundOn(on);
    if (on) playSound("toggle");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rise-in">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-mut">
          Configuration
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-txt">
          <span className="metal-text">Settings</span>
        </h1>
      </div>

      <section className="gold-frame mt-8 rounded-2xl bg-panel p-6 sm:p-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-txt">
          Your key
        </h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Name
            </p>
            <p className="mt-1 text-txt">
              {access.isOwner ? (access.name ?? "Chezburger") : (access.name ?? "—")}
            </p>
          </div>
          <div>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Access
            </p>
            <p className="mt-1">
              {access.isAdmin ? (
                <span className="metal-text font-display font-bold uppercase tracking-wider">
                  {access.isOwner ? "Owner" : "Admin"}
                </span>
              ) : access.accessType === "temporary" && access.expiresAt ? (
                <Countdown
                  expiresAt={access.expiresAt}
                  serverNow={access.now}
                  className="text-a1"
                />
              ) : (
                <span className="text-txt">Unlimited</span>
              )}
            </p>
          </div>
          <div>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Network address
            </p>
            <p className="mt-1 font-mono text-xs text-mut">{access.ip}</p>
          </div>
        </div>
      </section>

      <section className="gold-frame mt-6 rounded-2xl bg-panel p-6 sm:p-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-txt">
          Preferences
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-display text-sm font-semibold text-txt">Sound effects</p>
            <p className="mt-0.5 text-xs text-mut">
              Subtle clicks and chimes as you move around the vault.
            </p>
          </div>
          <Toggle on={sound} onChange={toggleSound} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-lg font-bold text-txt">Themes</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
            {THEMES.length} finishes
          </span>
        </div>
        <p className="mt-2 text-sm text-mut">
          Pick a finish for your vault. It's saved on this device and applies instantly.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {THEMES.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              theme={theme}
              active={theme.id === themeId}
              onPick={() => pickTheme(theme.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
