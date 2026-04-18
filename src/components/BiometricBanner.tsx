import { useState } from "react";
import { Fingerprint, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useSnackbar } from "@/context/useSnackbar";

const DISMISSED_KEY = "e4c_biometric_dismissed";

export function BiometricBanner() {
  const { biometricSupported, hasBiometric, isAuthenticated, enableBiometric } = useAuth();
  const { showError } = useSnackbar();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1"
  );
  const [loading, setLoading] = useState(false);

  if (!biometricSupported || hasBiometric || !isAuthenticated || dismissed) return null;

  const handleActivar = async () => {
    setLoading(true);
    try {
      await enableBiometric();
      // showSuccess no existe en todos los proyectos; usamos showError con texto positivo
      // En su lugar, el banner desaparece (hasBiometric=true) como confirmación visual
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo activar la huella");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-16 inset-x-0 z-40 px-4 pb-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-sm rounded-2xl border-2 border-primary bg-primary/10 shadow-xl backdrop-blur-sm p-4 flex items-center gap-3">
        <div className="shrink-0 rounded-full bg-primary/20 p-2">
          <Fingerprint className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">¿Activar acceso con huella?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Entra más rápido sin contraseña</p>
        </div>
        <Button size="sm" onClick={handleActivar} disabled={loading} className="shrink-0 font-semibold">
          Activar
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={loading}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Ahora no"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
