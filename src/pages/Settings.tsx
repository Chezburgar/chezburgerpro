import { useState } from "react";

import { applyTheme, savedThemeId, THEMES, type Theme } from "../themes";
import { useAccess } from "../access-context";
import { Countdown } from "../components/Countdown";

function ThemeSwatch({
  theme,
  active,
  onPick,
}: {
  theme: Theme;
  active: boolean;
  onPick: () => void;
}) {
  const [bg, panel, , , text, , a1, a2, a3] = theme.v;
  return (
    <button
      onClick={onPick}
      className={`group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
        active ? "border-a2 shadow-[0_0_0_1px_var(--a2)]" : "border-line hover:border-a3"
      }`}
      style={{ background: panel }}
    >
      <div
        className="flex h-14 items-center justify-center gap-1.5 rounded-lg border"
        style={{ background: bg, borderColor: theme.v[3] }}
      >
        <span
          className="h-6 w-6 rounded-full"
          style={{ background: `linear-gradient(160deg, ${a1}, ${a2}, ${a3})` }}
        />
        <span className="h-4 w-4 rounded-full opacity-80" style={{ background: a2 }} />
        <span className="h-2.5 w-2.5 rounded-full opacity-60" style={{ background: text }} />
      </div>
      <p className="mt-2 truncate text-xs font-semibold" style={{ color: text }}>
        {theme.name}
      </p>
      <p
        className="font-display text-[9px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: active ? a2 : theme.v[5] }}
      >
        {active ? "Active" : theme.light ? "Light" : "Dark"}
      </p>
    </button>
  );
}

export function SettingsPage() {
  const access = useAccess();
  const [themeId, setThemeId] = useState(savedThemeId);

  const pickTheme = (id: string) => {
    setThemeId(id);
    applyTheme(id);
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
