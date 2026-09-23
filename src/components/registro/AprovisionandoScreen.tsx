import { AlertCircle, Clock, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { EstadoPolling } from "@/hooks/usePollEstadoRegistro";

interface AprovisionandoScreenProps {
  estado: EstadoPolling;
  /** Reintentar el registro desde el paso 1 (solo tras ERROR). */
  onReintentar: () => void;
  onIrALogin: () => void;
}

/**
 * Desenlace del wizard: espera del aprovisionamiento asíncrono (§14 Paso 4).
 * El polling vive en `usePollEstadoRegistro`; aquí solo se renderiza su estado.
 * Progreso indeterminado a propósito — el spec prohíbe simular pasos falsos.
 */
export default function AprovisionandoScreen({
  estado,
  onReintentar,
  onIrALogin,
}: AprovisionandoScreenProps) {
  const fallo = estado.estatus === "ERROR" || estado.error !== null;

  if (fallo) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {estado.error ?? estado.msg ?? "No pudimos completar el alta de tu cuenta."}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onIrALogin}>
            Ir a inicio de sesión
          </Button>
          <Button type="button" className="flex-1" onClick={onReintentar}>
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  if (estado.expirado) {
    return (
      <div className="space-y-4">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Esto está tardando más de lo usual. Te avisamos por correo en cuanto tu cuenta esté
            lista.
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="w-full" onClick={onIrALogin}>
          Ir a inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center" aria-live="polite" aria-busy>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{estado.msg ?? "Creando tu cuenta…"}</p>
      <p className="text-xs text-muted-foreground">
        No cierres esta ventana. Puede tomar algunos minutos.
      </p>
    </div>
  );
}
