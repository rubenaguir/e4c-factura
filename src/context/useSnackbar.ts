import { useContext } from "react";
import { SnackbarContext } from "./snackbar-context-def";
import type { SnackbarContextValue } from "./snackbar-context-def";

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used within SnackbarProvider");
  return ctx;
}
