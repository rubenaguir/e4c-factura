import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [updating, setUpdating] = useState(false);

  if (!needRefresh) return null;

  async function handleUpdate() {
    setUpdating(true);
    await updateServiceWorker(true);
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl shadow-2xl border border-primary bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">Nueva versión disponible</p>
            <p className="text-xs opacity-80 leading-tight">Actualiza para obtener las últimas mejoras.</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 gap-1.5 font-semibold"
          disabled={updating}
          onClick={handleUpdate}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`} />
          {updating ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>
    </div>
  );
}
