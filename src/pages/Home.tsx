import { useQuery } from "@tanstack/react-query";

import { getCatalog, type Game } from "../api";
import { useAccess } from "../access-context";

function GameCard({ game }: { game: Game }) {
  return (
    <a
      href={`#/play/${game.id}`}
      className="sheen gold-frame group block rounded-xl bg-panel p-4 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-line bg-panel2">
        {game.icon_url ? (
          <img
            src={game.icon_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="metal-text font-display text-4xl font-bold">
            {game.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <p className="mt-3 truncate font-display text-sm font-semibold text-txt">{game.name}</p>
      <p className="mt-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut group-hover:text-a2">
        Play now
      </p>
    </a>
  );
}

export function HomePage() {
  const access = useAccess();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: getCatalog });

  if (catalog.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-line bg-panel p-4">
              <div className="aspect-square rounded-lg bg-panel2" />
              <div className="mt-3 h-3 w-2/3 rounded bg-panel2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (catalog.isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-mut">{(catalog.error as Error).message}</p>
      </div>
    );
  }

  const { categories, games } = catalog.data;
  const byCategory = new Map<string | null, Game[]>();
  for (const game of games) {
    const key = game.category_id;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(game);
  }
  const shelves: { id: string | null; name: string; games: Game[] }[] = [];
  for (const cat of categories) {
    const catGames = byCategory.get(cat.id);
    if (catGames?.length) shelves.push({ id: cat.id, name: cat.name, games: catGames });
  }
  const uncategorized = byCategory.get(null);
  if (uncategorized?.length) {
    shelves.push({ id: null, name: "The open shelf", games: uncategorized });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rise-in">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-mut">
          Welcome back{access.name ? `, ${access.name}` : ""}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-txt sm:text-4xl">
          The <span className="metal-text">collection</span>
        </h1>
      </div>

      {shelves.length === 0 ? (
        <div className="gold-frame mt-12 rounded-2xl bg-panel px-8 py-16 text-center">
          <p className="metal-text font-display text-5xl font-bold">∅</p>
          <h2 className="mt-4 font-display text-lg font-bold text-txt">The shelves are empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-mut">
            No games yet. Suggest one on the Request tab and the keymaster will stock the vault.
          </p>
          <a
            href="#/request"
            className="sheen metal-fill mt-6 inline-block rounded-lg px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.2em]"
          >
            Suggest a game
          </a>
        </div>
      ) : (
        shelves.map((shelf) => (
          <section key={shelf.id ?? "none"} className="mt-12">
            <div className="flex items-baseline gap-4">
              <h2 className="font-display text-lg font-bold text-txt">{shelf.name}</h2>
              <span className="h-px flex-1 bg-gradient-to-r from-a3/60 to-transparent" />
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-mut">
                {shelf.games.length} {shelf.games.length === 1 ? "game" : "games"}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {shelf.games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
