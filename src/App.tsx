import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAccessState, type AccessState } from "./api";
import { AccessContext } from "./access-context";
import { useHashRoute } from "./router";
import { Gate } from "./components/Gate";
import { Monogram } from "./components/Monogram";
import { Countdown } from "./components/Countdown";
import { HomePage } from "./pages/Home";
import { PlayPage } from "./pages/Play";
import { SchoolPage } from "./pages/School";
import { RequestPage } from "./pages/Request";
import { SettingsPage } from "./pages/Settings";
import { AdminPage } from "./pages/Admin";

const NAV_TABS = [
  { to: "/", label: "Home" },
  { to: "/school", label: "School" },
  { to: "/request", label: "Request" },
  { to: "/settings", label: "Settings" },
] as const;

function AccessChip({ access }: { access: AccessState }) {
  const queryClient = useQueryClient();
  if (access.isAdmin) {
    return (
      <span className="gold-frame flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 text-xs">
        <span className="metal-text font-display font-bold uppercase tracking-[0.2em]">Admin</span>
      </span>
    );
  }
  if (access.accessType === "temporary" && access.expiresAt) {
    return (
      <span className="gold-frame flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 text-xs text-txt">
        <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-a2" />
        <Countdown
          expiresAt={access.expiresAt}
          serverNow={access.now}
          onExpire={() => queryClient.invalidateQueries({ queryKey: ["access"] })}
          className="text-a1"
        />
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-mut">
      <span className="block h-1.5 w-1.5 rounded-full bg-a2" />
      {access.name ?? "Member"}
    </span>
  );
}

function Shell({
  access,
  path,
  children,
}: {
  access: AccessState;
  path: string;
  children: React.ReactNode;
}) {
  const tabClass = (to: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return `rounded-md px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
      active ? "bg-panel2 text-a1" : "text-mut hover:text-txt"
    }`;
  };
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <a href="#/" className="flex items-center gap-3">
            <Monogram size={34} ring={false} />
            <span className="font-display text-sm font-bold uppercase tracking-[0.25em] text-txt">
              Chezburger<span className="metal-text">PRO</span>
            </span>
          </a>
          <nav className="no-scrollbar ml-auto flex items-center gap-1 overflow-x-auto sm:gap-2">
            {NAV_TABS.map((tab) => (
              <a key={tab.to} href={`#${tab.to}`} className={tabClass(tab.to)}>
                {tab.label}
              </a>
            ))}
            {access.isAdmin && (
              <a
                href="#/admin"
                className={`rounded-md px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                  path.startsWith("/admin") ? "bg-panel2" : ""
                }`}
              >
                <span className="metal-text">Admin</span>
              </a>
            )}
          </nav>
          <div className="hidden sm:block">
            <AccessChip access={access} />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line py-6">
        <p className="text-center font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-mut">
          ChezburgerPRO — members only
        </p>
      </footer>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <svg viewBox="0 0 100 100" className="seal-ring absolute inset-0" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="var(--a3)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          </svg>
          <Monogram size={80} />
        </div>
        <p className="mt-5 font-display text-[10px] font-semibold uppercase tracking-[0.35em] text-mut">
          Opening the vault
        </p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="metal-text font-display text-6xl font-bold">404</p>
      <h1 className="mt-4 font-display text-xl font-bold text-txt">This shelf is empty</h1>
      <a
        href="#/"
        className="sheen metal-fill mt-6 inline-block rounded-lg px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.2em]"
      >
        Back to the vault
      </a>
    </div>
  );
}

function Routes({ path }: { path: string }) {
  if (path === "/") return <HomePage />;
  if (path === "/school") return <SchoolPage />;
  if (path === "/request") return <RequestPage />;
  if (path === "/settings") return <SettingsPage />;
  if (path === "/admin") return <AdminPage />;
  if (path.startsWith("/play/")) return <PlayPage gameId={path.slice("/play/".length)} />;
  return <NotFound />;
}

export function App() {
  const path = useHashRoute();
  const accessQuery = useQuery({
    queryKey: ["access"],
    queryFn: getAccessState,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 15_000;
      if (!data.adminExists || data.status === "pending") return 8_000;
      return 60_000;
    },
    refetchOnWindowFocus: true,
  });

  if (accessQuery.isPending) return <Splash />;
  if (accessQuery.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-lg font-bold text-txt">Can't reach the vault</h1>
          <p className="mt-2 text-sm text-mut">{(accessQuery.error as Error).message}</p>
          <button
            onClick={() => accessQuery.refetch()}
            className="metal-fill mt-5 rounded-lg px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.15em]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const access = accessQuery.data;
  const allowed = access.isAdmin || access.status === "approved";

  return (
    <AccessContext.Provider value={access}>
      {allowed ? (
        <Shell access={access} path={path}>
          <Routes path={path} />
        </Shell>
      ) : (
        <Gate access={access} />
      )}
    </AccessContext.Provider>
  );
}
