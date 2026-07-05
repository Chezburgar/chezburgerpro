import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { submitSuggestion } from "../api";
import { useAccess } from "../access-context";

export function RequestPage() {
  const access = useAccess();
  const [gameName, setGameName] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: () =>
      submitSuggestion({
        gameName: gameName.trim(),
        gameUrl: gameUrl.trim() || undefined,
        note: note.trim() || undefined,
        requesterName: access.name ?? undefined,
      }),
    onSuccess: () => {
      setSent(true);
      setGameName("");
      setGameUrl("");
      setNote("");
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rise-in">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-mut">
          The suggestion slot
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-txt">
          Request a <span className="metal-text">game</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mut">
          Drop a suggestion through the slot. It lands directly on the keymaster's desk in the
          admin panel.
        </p>
      </div>

      {sent && (
        <div className="gold-frame mt-8 rounded-xl bg-panel p-5">
          <p className="font-display text-sm font-bold text-a1">Suggestion delivered.</p>
          <p className="mt-1 text-sm text-mut">
            The keymaster will review it. Feel free to send another.
          </p>
        </div>
      )}

      <form
        className="gold-frame mt-8 rounded-2xl bg-panel p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(false);
          if (gameName.trim()) send.mutate();
        }}
      >
        <label className="block">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-mut">
            Game name *
          </span>
          <input
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. 2048"
            className="mt-2 w-full rounded-lg border border-line bg-bg px-4 py-3 text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2"
          />
        </label>
        <label className="mt-5 block">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-mut">
            Link (optional)
          </span>
          <input
            value={gameUrl}
            onChange={(e) => setGameUrl(e.target.value)}
            maxLength={500}
            type="url"
            placeholder="https://…"
            className="mt-2 w-full rounded-lg border border-line bg-bg px-4 py-3 text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2"
          />
        </label>
        <label className="mt-5 block">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-mut">
            Why this one? (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Anything the keymaster should know"
            className="mt-2 w-full resize-none rounded-lg border border-line bg-bg px-4 py-3 text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2"
          />
        </label>
        {send.isError && (
          <p className="mt-4 text-sm text-red-400">{(send.error as Error).message}</p>
        )}
        <button
          type="submit"
          disabled={send.isPending || !gameName.trim()}
          className="sheen metal-fill mt-6 w-full rounded-lg px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {send.isPending ? "Sending…" : "Send suggestion"}
        </button>
      </form>
    </div>
  );
}
