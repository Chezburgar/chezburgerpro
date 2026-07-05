import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useAccess } from "../access-context";
import {
  addCategory,
  addGame,
  decideRequest,
  deleteCategory,
  deleteGame,
  deleteSuggestion,
  getCatalog,
  listAccess,
  listSuggestions,
  revokeAccess,
  updateGameCategory,
  updateSuggestion,
  uploadIcon,
} from "../api";
import { Countdown } from "../components/Countdown";

const DURATIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "1 week", minutes: 10080 },
] as const;

type AdminTab = "requests" | "members" | "games" | "categories" | "suggestions";

const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2";
const ghostBtn =
  "rounded-md border border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-mut transition-colors hover:text-txt";
const dangerBtn =
  "rounded-md border border-red-500/40 px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-red-400 transition-colors hover:bg-red-500/10";
const goldBtn =
  "sheen metal-fill rounded-md px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] transition-transform active:scale-[0.97] disabled:opacity-50";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gold-frame rounded-2xl bg-panel p-5 sm:p-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-txt">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-mut">{text}</p>;
}

// ---- Requests tab -----------------------------------------------------------

function RequestsTab() {
  const queryClient = useQueryClient();
  const accessList = useQuery({
    queryKey: ["admin", "access"],
    queryFn: listAccess,
    refetchInterval: 10_000,
  });
  const [durations, setDurations] = useState<Record<string, number>>({});

  const decide = useMutation({
    mutationFn: decideRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "access"] }),
  });

  if (accessList.isPending) return <Empty text="Loading requests…" />;
  if (accessList.isError) return <Empty text={(accessList.error as Error).message} />;

  const { pending } = accessList.data;

  return (
    <SectionCard title={`Access requests — ${pending.length} waiting`}>
      {pending.length === 0 ? (
        <Empty text="No one is knocking right now." />
      ) : (
        <ul className="divide-y divide-line">
          {pending.map((req) => (
            <li key={req.id} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-40">
                <p className="font-display text-sm font-bold text-txt">{req.name}</p>
                <p className="mt-0.5 font-mono text-xs text-mut">{req.ip}</p>
                <p className="mt-0.5 text-xs text-mut">
                  {new Date(req.created_at).toLocaleString()}
                </p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    decide.mutate({ id: req.id, action: "approve", accessType: "unlimited" })
                  }
                  disabled={decide.isPending}
                  className={goldBtn}
                >
                  Unlimited
                </button>
                <div className="flex items-center gap-1">
                  <select
                    value={durations[req.id] ?? 60}
                    onChange={(e) =>
                      setDurations((d) => ({ ...d, [req.id]: Number(e.target.value) }))
                    }
                    className="rounded-md border border-line bg-bg px-2 py-2 text-xs text-txt outline-none focus:border-a2"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.minutes} value={d.minutes}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      decide.mutate({
                        id: req.id,
                        action: "approve",
                        accessType: "temporary",
                        durationMinutes: durations[req.id] ?? 60,
                      })
                    }
                    disabled={decide.isPending}
                    className="rounded-md border border-a3 px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-a1 transition-colors hover:bg-a3/20 disabled:opacity-50"
                  >
                    Temporary
                  </button>
                </div>
                <button
                  onClick={() => decide.mutate({ id: req.id, action: "deny" })}
                  disabled={decide.isPending}
                  className={dangerBtn}
                >
                  Deny
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ---- Members tab ---------------------------------------------------------------

function MembersTab() {
  const queryClient = useQueryClient();
  const accessList = useQuery({
    queryKey: ["admin", "access"],
    queryFn: listAccess,
    refetchInterval: 30_000,
  });
  const revoke = useMutation({
    mutationFn: revokeAccess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "access"] }),
  });

  if (accessList.isPending) return <Empty text="Loading members…" />;
  if (accessList.isError) return <Empty text={(accessList.error as Error).message} />;

  const { members, history, now } = accessList.data;

  return (
    <div className="space-y-6">
      <SectionCard title={`Active members — ${members.length}`}>
        {members.length === 0 ? (
          <Empty text="Nobody holds a key yet." />
        ) : (
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-40">
                  <p className="font-display text-sm font-bold text-txt">{m.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-mut">{m.ip}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {m.access_type === "temporary" && m.expires_at ? (
                    <span className="gold-frame rounded-full bg-panel2 px-3 py-1.5 text-xs">
                      <Countdown expiresAt={m.expires_at} serverNow={now} className="text-a1" />
                    </span>
                  ) : (
                    <span className="metal-text font-display text-xs font-bold uppercase tracking-[0.15em]">
                      Unlimited
                    </span>
                  )}
                  <button
                    onClick={() => revoke.mutate(m.id)}
                    disabled={revoke.isPending}
                    className={dangerBtn}
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard title="History">
        {history.length === 0 ? (
          <Empty text="No past decisions yet." />
        ) : (
          <ul className="divide-y divide-line">
            {history.slice(0, 20).map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-3">
                <div>
                  <p className="text-sm text-txt">{h.name}</p>
                  <p className="font-mono text-xs text-mut">{h.ip}</p>
                </div>
                <span
                  className={`ml-auto font-display text-[10px] font-bold uppercase tracking-[0.2em] ${
                    h.status === "denied" || h.status === "revoked" ? "text-red-400" : "text-mut"
                  }`}
                >
                  {h.status === "approved" ? "expired" : h.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

// ---- Games tab -------------------------------------------------------------------

function GamesTab() {
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: getCatalog });
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });

  const create = useMutation({
    mutationFn: async () => {
      let iconUrl: string | undefined;
      if (iconFile) {
        iconUrl = await uploadIcon(iconFile);
      }
      return addGame({
        name: name.trim(),
        url: url.trim(),
        categoryId: categoryId || undefined,
        iconUrl,
      });
    },
    onSuccess: () => {
      setName("");
      setUrl("");
      setCategoryId("");
      setIconFile(null);
      setUploadError(null);
      if (fileInput.current) fileInput.current.value = "";
      invalidate();
    },
    onError: (e) => setUploadError((e as Error).message),
  });

  const remove = useMutation({ mutationFn: deleteGame, onSuccess: invalidate });
  const recategorize = useMutation({
    mutationFn: (vars: { id: string; categoryId?: string }) =>
      updateGameCategory(vars.id, vars.categoryId),
    onSuccess: invalidate,
  });

  if (catalog.isPending) return <Empty text="Loading games…" />;
  if (catalog.isError) return <Empty text={(catalog.error as Error).message} />;

  const { categories, games } = catalog.data;
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "The open shelf";

  return (
    <div className="space-y-6">
      <SectionCard title="Add a game">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && url.trim()) create.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="block">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Name *
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Game title"
              className={`mt-1.5 ${inputCls}`}
            />
          </label>
          <label className="block">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Embed URL *
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              type="url"
              maxLength={1000}
              placeholder="https://…"
              className={`mt-1.5 ${inputCls}`}
            />
          </label>
          <label className="block">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Category
            </span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
            >
              <option value="">The open shelf (no category)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
              Icon (optional, image up to 2 MB)
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
              className="mt-1.5 w-full text-xs text-mut file:mr-3 file:rounded-md file:border file:border-a3 file:bg-transparent file:px-3 file:py-2 file:font-display file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-a1"
            />
          </label>
          {uploadError && <p className="text-sm text-red-400 sm:col-span-2">{uploadError}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={create.isPending} className={goldBtn}>
              {create.isPending ? "Adding…" : "Add game"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title={`Library — ${games.length} games`}>
        {games.length === 0 ? (
          <Empty text="No games in the vault yet." />
        ) : (
          <ul className="divide-y divide-line">
            {games.map((game) => (
              <li key={game.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-line bg-panel2">
                  {game.icon_url ? (
                    <img src={game.icon_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="metal-text font-display text-sm font-bold">
                      {game.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-txt">
                    {game.name}
                  </p>
                  <p className="truncate text-xs text-mut">{game.url}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={game.category_id ?? ""}
                    onChange={(e) =>
                      recategorize.mutate({ id: game.id, categoryId: e.target.value || undefined })
                    }
                    className="rounded-md border border-line bg-bg px-2 py-1.5 text-xs text-mut outline-none focus:border-a2"
                    title={`Category: ${categoryName(game.category_id)}`}
                  >
                    <option value="">The open shelf</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove.mutate(game.id)}
                    disabled={remove.isPending}
                    className={dangerBtn}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

// ---- Categories tab -----------------------------------------------------------------

function CategoriesTab() {
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: getCatalog });
  const [name, setName] = useState("");
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });

  const create = useMutation({
    mutationFn: () => addCategory(name.trim()),
    onSuccess: () => {
      setName("");
      invalidate();
    },
  });
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: invalidate });

  if (catalog.isPending) return <Empty text="Loading categories…" />;
  if (catalog.isError) return <Empty text={(catalog.error as Error).message} />;

  const { categories, games } = catalog.data;

  return (
    <SectionCard title={`Categories — ${categories.length}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          placeholder="New category name"
          className={inputCls}
        />
        <button type="submit" disabled={create.isPending} className={goldBtn}>
          Add
        </button>
      </form>
      {categories.length === 0 ? (
        <Empty text="No categories yet — games land on the open shelf." />
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {categories.map((cat) => {
            const count = games.filter((g) => g.category_id === cat.id).length;
            return (
              <li key={cat.id} className="flex items-center gap-3 py-3">
                <p className="font-display text-sm font-semibold text-txt">{cat.name}</p>
                <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
                  {count} {count === 1 ? "game" : "games"}
                </span>
                <button
                  onClick={() => remove.mutate(cat.id)}
                  disabled={remove.isPending}
                  className={`ml-auto ${dangerBtn}`}
                  title="Games in this category move to the open shelf"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

// ---- Suggestions tab ---------------------------------------------------------------

function SuggestionsTab() {
  const queryClient = useQueryClient();
  const suggestions = useQuery({
    queryKey: ["admin", "suggestions"],
    queryFn: listSuggestions,
    refetchInterval: 20_000,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "suggestions"] });

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: "new" | "done" | "dismissed" }) =>
      updateSuggestion(vars.id, vars.status),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteSuggestion, onSuccess: invalidate });

  if (suggestions.isPending) return <Empty text="Loading suggestions…" />;
  if (suggestions.isError) return <Empty text={(suggestions.error as Error).message} />;

  const items = suggestions.data;

  return (
    <SectionCard
      title={`Game suggestions — ${items.filter((s) => s.status === "new").length} new`}
    >
      {items.length === 0 ? (
        <Empty text="The suggestion slot is empty." />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((s) => (
            <li key={s.id} className="py-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-txt">
                    {s.game_name}
                    {s.status !== "new" && (
                      <span
                        className={`ml-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] ${
                          s.status === "done" ? "text-a2" : "text-mut"
                        }`}
                      >
                        {s.status}
                      </span>
                    )}
                  </p>
                  {s.game_url && (
                    <a
                      href={s.game_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-a1 hover:underline"
                    >
                      {s.game_url}
                    </a>
                  )}
                  {s.note && <p className="mt-1 text-sm text-mut">{s.note}</p>}
                  <p className="mt-1 text-xs text-mut">
                    {s.requester_name ?? "Anonymous"} · {s.ip} ·{" "}
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.status !== "done" && (
                    <button
                      onClick={() => setStatus.mutate({ id: s.id, status: "done" })}
                      className={goldBtn}
                    >
                      Done
                    </button>
                  )}
                  {s.status === "new" && (
                    <button
                      onClick={() => setStatus.mutate({ id: s.id, status: "dismissed" })}
                      className={ghostBtn}
                    >
                      Dismiss
                    </button>
                  )}
                  <button onClick={() => remove.mutate(s.id)} className={dangerBtn}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ---- Page ----------------------------------------------------------------------------

const TABS: { id: AdminTab; label: string }[] = [
  { id: "requests", label: "Requests" },
  { id: "members", label: "Members" },
  { id: "games", label: "Games" },
  { id: "categories", label: "Categories" },
  { id: "suggestions", label: "Suggestions" },
];

export function AdminPage() {
  const access = useAccess();
  const [tab, setTab] = useState<AdminTab>("requests");

  if (!access.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-txt">Keymaster only</h1>
        <p className="mt-2 text-sm text-mut">
          The admin panel is bound to the keymaster's network address. Yours doesn't match.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="rise-in">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-mut">
          The keymaster's desk
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-txt">
          <span className="metal-text">Admin</span> panel
        </h1>
      </div>

      <div className="no-scrollbar mt-8 flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
              tab === t.id ? "metal-fill" : "text-mut hover:text-txt"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "requests" && <RequestsTab />}
        {tab === "members" && <MembersTab />}
        {tab === "games" && <GamesTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "suggestions" && <SuggestionsTab />}
      </div>
    </div>
  );
}
