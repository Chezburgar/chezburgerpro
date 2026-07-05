import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { claimFounderKey, recoverOwner, submitAccessRequest, type AccessState } from "../api";
import { playSound } from "../sound";
import { Monogram } from "./Monogram";

function OwnerRecovery() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const recover = useMutation({
    mutationFn: (c: string) => recoverOwner(c),
    onSuccess: () => {
      playSound("open");
      queryClient.invalidateQueries({ queryKey: ["access"] });
    },
    onError: () => playSound("error"),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 block text-xs text-mut underline decoration-a3/50 underline-offset-4 transition-colors hover:text-a1"
      >
        Owner? Recover access
      </button>
    );
  }

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) recover.mutate(code.trim());
      }}
    >
      <label className="block">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-mut">
          Owner recovery code
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          placeholder="CHEZ-XXXX-XXXX"
          className="mt-2 w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-center font-mono uppercase tracking-widest text-txt outline-none transition-colors placeholder:text-mut/50 focus:border-a2"
        />
      </label>
      {recover.isError && (
        <p className="mt-2 text-xs text-red-400">{(recover.error as Error).message}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={recover.isPending || !code.trim()}
          className="metal-fill flex-1 rounded-lg px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-50"
        >
          {recover.isPending ? "Checking…" : "Recover"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.15em] text-mut hover:text-txt"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function GateFrame({
  children,
  showRecovery = true,
}: {
  children: React.ReactNode;
  showRecovery?: boolean;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="rise-in w-full max-w-md">
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="seal-ring absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="var(--a3)"
              strokeWidth="0.8"
              strokeDasharray="3 6"
            />
          </svg>
          <Monogram size={92} />
        </div>
        <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.35em] text-mut">
          Chezburger
          <span className="metal-text ml-2">PRO</span>
        </p>
        <div className="gold-frame mt-6 rounded-2xl bg-panel p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          {children}
          {showRecovery && <OwnerRecovery />}
        </div>
        <p className="mt-6 text-center text-xs text-mut">
          Access is saved to this device. Chezburger reviews every request.
        </p>
      </div>
    </div>
  );
}

function NameForm({
  title,
  subtitle,
  cta,
  onSubmit,
  busy,
  error,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onSubmit: (name: string) => void;
  busy: boolean;
  error?: string | null;
}) {
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
    >
      <h1 className="font-display text-2xl font-bold tracking-tight text-txt">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-mut">{subtitle}</p>
      <label className="mt-6 block">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-mut">
          Your name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          autoFocus
          placeholder="Who's knocking?"
          className="mt-2 w-full rounded-lg border border-line bg-bg px-4 py-3 text-txt outline-none transition-colors placeholder:text-mut/60 focus:border-a2"
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="sheen metal-fill mt-6 w-full rounded-lg px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Sending…" : cta}
      </button>
    </form>
  );
}

function StatusPanel({
  tone,
  title,
  body,
  children,
}: {
  tone: "wait" | "bad";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border ${
          tone === "wait" ? "border-a2/60" : "border-red-500/50"
        }`}
      >
        {tone === "wait" ? (
          <span className="block h-3 w-3 animate-pulse rounded-full bg-a2" />
        ) : (
          <span className="text-lg text-red-400">✕</span>
        )}
      </div>
      <h1 className="mt-4 font-display text-xl font-bold text-txt">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-mut">{body}</p>
      {children}
    </div>
  );
}

export function Gate({ access }: { access: AccessState }) {
  const queryClient = useQueryClient();
  const [reRequesting, setReRequesting] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["access"] });

  const request = useMutation({
    mutationFn: (name: string) => submitAccessRequest(name),
    onSuccess: () => {
      playSound("success");
      refresh();
    },
    onError: () => playSound("error"),
  });
  const claim = useMutation({
    mutationFn: (name: string) => claimFounderKey(name),
    onSuccess: () => {
      playSound("open");
      refresh();
    },
    onError: () => playSound("error"),
  });

  // One-time founder setup: nobody owns the vault yet.
  if (!access.adminExists) {
    return (
      <GateFrame showRecovery={false}>
        <NameForm
          title="Claim the founder key"
          subtitle="The vault has no owner yet. The first person to claim this key becomes Chezburger — the admin panel binds to their network address, permanently. If this is your site, claim it now."
          cta="Claim the founder key"
          busy={claim.isPending}
          error={claim.isError ? (claim.error as Error).message : null}
          onSubmit={(name) => claim.mutate(name)}
        />
      </GateFrame>
    );
  }

  if (access.status === "pending" && !reRequesting) {
    return (
      <GateFrame>
        <StatusPanel
          tone="wait"
          title="Request received"
          body={`Hang tight${access.name ? `, ${access.name}` : ""} — Chezburger has your request. This screen refreshes on its own the moment you're approved.`}
        />
      </GateFrame>
    );
  }

  if ((access.status === "denied" || access.status === "revoked") && !reRequesting) {
    return (
      <GateFrame>
        <StatusPanel
          tone="bad"
          title={access.status === "denied" ? "Request declined" : "Access revoked"}
          body={
            access.status === "denied"
              ? "Chezburger declined your request. You can knock again."
              : "Your key was withdrawn. You can request a new one."
          }
        >
          <button
            onClick={() => setReRequesting(true)}
            className="mt-6 w-full rounded-lg border border-a3 px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-a1 transition-colors hover:bg-a3/20"
          >
            Request again
          </button>
        </StatusPanel>
      </GateFrame>
    );
  }

  if (access.status === "expired" && !reRequesting) {
    return (
      <GateFrame>
        <StatusPanel
          tone="bad"
          title="Your time ran out"
          body="Temporary access has expired. Request a new key to get back in."
        >
          <button
            onClick={() => setReRequesting(true)}
            className="sheen metal-fill mt-6 w-full rounded-lg px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em]"
          >
            Request new access
          </button>
        </StatusPanel>
      </GateFrame>
    );
  }

  return (
    <GateFrame>
      <NameForm
        title="The vault is locked"
        subtitle="ChezburgerPRO is members-only. Tell Chezburger who you are and your request lands on the admin desk for approval."
        cta="Request access"
        busy={request.isPending}
        error={request.isError ? (request.error as Error).message : null}
        onSubmit={(name) => {
          setReRequesting(false);
          request.mutate(name);
        }}
      />
    </GateFrame>
  );
}
