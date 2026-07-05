// Thin client for the ChezburgerPRO Supabase Edge Function backend.
// Identity is a persistent per-browser device key (below), sent on every
// request as the x-device-id header; the server enforces all access from it.
// This survives IP changes (cellular networks rotate IPs constantly).

const API_BASE = "https://qhrthvifjrceodrmkvbv.supabase.co/functions/v1/api";

const DEVICE_KEY = "cbp_device";

// A stable random id for this browser. Created once, then reused forever so a
// member/owner stays recognized even when their IP changes.
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export type AccessState = {
  ip: string;
  isAdmin: boolean;
  isOwner: boolean;
  adminExists: boolean;
  status: "none" | "pending" | "approved" | "denied" | "revoked" | "expired";
  name: string | null;
  accessType: "unlimited" | "temporary" | null;
  expiresAt: number | null;
  now: number;
};

export type Admin = {
  device_id: string | null;
  ip: string;
  name: string;
  is_owner: boolean;
  created_at: number;
};

export type Category = { id: string; name: string; sort: number };
export type Game = {
  id: string;
  category_id: string | null;
  name: string;
  url: string;
  icon_url: string | null;
};
export type AccessRow = {
  id: string;
  ip: string;
  device_id: string | null;
  name: string;
  status: string;
  access_type: "unlimited" | "temporary" | null;
  expires_at: number | null;
  created_at: number;
  decided_at: number | null;
};
export type Suggestion = {
  id: string;
  ip: string;
  requester_name: string | null;
  game_name: string;
  game_url: string | null;
  note: string | null;
  status: "new" | "done" | "dismissed";
  created_at: number;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("x-device-id", getDeviceId());
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

function post<T>(path: string, data: unknown): Promise<T> {
  return call<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---- public ----
export const getAccessState = () => call<AccessState>("/access");
export const submitAccessRequest = (name: string) =>
  post<{ ok: boolean; already: boolean }>("/request-access", { name });
export const claimFounderKey = (name: string) => post<{ ok: boolean }>("/claim-founder", { name });
export const recoverOwner = (code: string) => post<{ ok: boolean }>("/owner-recover", { code });

// ---- member ----
export const getCatalog = () =>
  call<{ categories: Category[]; games: Game[] }>("/catalog");
export const submitSuggestion = (data: {
  gameName: string;
  gameUrl?: string;
  note?: string;
  requesterName?: string;
}) => post<{ ok: boolean }>("/suggest", data);

// ---- admin ----
export const listAccess = () =>
  call<{ pending: AccessRow[]; members: AccessRow[]; history: AccessRow[]; now: number }>(
    "/admin/access",
  );
export const decideRequest = (data: {
  id: string;
  action: "approve" | "deny";
  accessType?: "unlimited" | "temporary";
  durationMinutes?: number;
}) => post<{ ok: boolean }>("/admin/decide", data);
export const revokeAccess = (id: string) => post<{ ok: boolean }>("/admin/revoke", { id });

// ---- admin roster (owner only) ----
export const listAdmins = () => call<Admin[]>("/admin/admins");
export const grantAdmin = (deviceId: string, name: string) =>
  post<{ ok: boolean }>("/admin/grant-admin", { deviceId, name });
export const revokeAdmin = (deviceId: string) =>
  post<{ ok: boolean }>("/admin/revoke-admin", { deviceId });
export const resetRecoveryCode = () =>
  post<{ ok: boolean; code: string }>("/admin/reset-recovery-code", {});
export const addCategory = (name: string) => post<{ ok: boolean }>("/admin/category", { name });
export const deleteCategory = (id: string) =>
  post<{ ok: boolean }>("/admin/category-delete", { id });
export const addGame = (data: {
  name: string;
  url: string;
  categoryId?: string;
  iconUrl?: string;
}) => post<{ ok: boolean }>("/admin/game", data);
export const deleteGame = (id: string) => post<{ ok: boolean }>("/admin/game-delete", { id });
export const updateGameCategory = (id: string, categoryId?: string) =>
  post<{ ok: boolean }>("/admin/game-category", { id, categoryId });
export const listSuggestions = () => call<Suggestion[]>("/admin/suggestions");
export const updateSuggestion = (id: string, status: "new" | "done" | "dismissed") =>
  post<{ ok: boolean }>("/admin/suggestion-status", { id, status });
export const deleteSuggestion = (id: string) =>
  post<{ ok: boolean }>("/admin/suggestion-delete", { id });

export async function uploadIcon(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/admin/upload-icon`, {
    method: "POST",
    headers: { "x-device-id": getDeviceId() },
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok || !body?.url) {
    throw new Error(body?.error ?? "Icon upload failed");
  }
  return body.url as string;
}
