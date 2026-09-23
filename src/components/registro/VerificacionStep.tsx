import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerificacionStepProps {
  email: string;
  /** `msg` de IniciarRegistro ("te enviamos un código a…"), tal cual del backend. */
  msgOtp: string | null;
  codigo: string;
  onCodigoChange: (valor: string) => void;
  aceptaTerminos: boolean;
  onAceptaTerminosChange: (valor: boolean) => void;
  errores: Record<string, string>;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  /** `msg` del backend de ConfirmarRegistro (código incorrecto, expirado, sin intentos). */
  errorBackend: string | null;
}

/** Paso 3 del registro: código de verificación + términos. */
export default function VerificacionStep({
  email,
  msgOtp,
  codigo,
  onCodigoChange,
  aceptaTerminos,
  onAceptaTerminosChange,
  errores,
  onSubmit,
  onBack,
  loading,
  errorBackend,
}: VerificacionStepProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Alert>
        <MailCheck className="h-4 w-4" />
        <AlertDescription className="whitespace-pre-line">
          {msgOtp ?? `Enviamos un código de verificación a ${email}.`}
        </AlertDescription>
      </Alert>

      {errorBackend && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{errorBackend}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="codigo">Código de verificación</Label>
        <Input
          id="codigo"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="text-center text-lg tracking-[0.5em]"
          value={codigo}
          disabled={loading}
          onChange={(e) => onCodigoChange(e.target.value.replace(/\D/g, ""))}
        />
        {errores.codigo && <p className="text-xs text-destructive mt-1">{errores.codigo}</p>}
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            checked={aceptaTerminos}
            disabled={loading}
            onChange={(e) => onAceptaTerminosChange(e.target.checked)}
          />
          <span>Acepto los términos y condiciones y el aviso de privacidad.</span>
        </label>
        {errores.acepta_terminos && (
          <p className="text-xs text-destructive mt-1">{errores.acepta_terminos}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
          Regresar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear mi cuenta
        </Button>
      </div>
    </form>
  );
}
