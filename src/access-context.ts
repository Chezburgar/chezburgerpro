import { createContext, useContext } from "react";

import type { AccessState } from "./api";

export const AccessContext = createContext<AccessState | null>(null);

export function useAccess(): AccessState {
  const value = useContext(AccessContext);
  if (!value) throw new Error("useAccess must be used inside the app shell");
  return value;
}
