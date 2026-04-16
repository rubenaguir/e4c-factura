import { useCallback, useRef, useState } from "react";
import { X, CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import { SnackbarContext } from "./snackbar-context-def";

type SnackbarVariant = "error" | "success";

interface SnackbarItem {
  id: number;
  message: string;
  variant: SnackbarVariant;
}

let nextId = 1;
const AUTO_DISMISS_MS = 5000;

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: SnackbarVariant) => {
      const id = nextId++;
      setItems((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const showError = useCallback((message: string) => show(message, "error"), [show]);
  const showSuccess = useCallback((message: string) => show(message, "success"), [show]);

  return (
    <SnackbarContext.Provider value={{ showError, showSuccess }}>
      {children}
      {items.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
        >
          {items.map((item) => (
            <div
              key={item.id}
              role="alert"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm",
                item.variant === "error"
                  ? "bg-destructive text-destructive-foreground border-destructive/60"
                  : "bg-green-600 text-white border-green-700"
              )}
            >
              {item.variant === "error" ? (
                <CircleX className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <CircleCheck className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-snug">{item.message}</span>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SnackbarContext.Provider>
  );
}
