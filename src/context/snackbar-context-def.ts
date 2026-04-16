import { createContext } from "react";

export interface SnackbarContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
