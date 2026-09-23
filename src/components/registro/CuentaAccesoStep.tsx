import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CuentaAccesoValues } from "@/lib/registroSchemas";

interface CuentaAccesoStepProps {
  cuenta: CuentaAccesoValues;
  errores: Record<string, string>;
  onChange: (campo: keyof CuentaAccesoValues, valor: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  /** `msg` del backend de IniciarRegistro (p. ej. rate limit excedido). */
  errorBackend: string | null;
}

const REQUISITOS = [
  "8 caracteres o más",
  "una mayúscula y una minúscula",
  "un dígito",
  "un carácter especial (!@#$%^&*()_+=[]{};:<>|./?,-)",
];

/** Paso 2 del registro: correo + contraseña de la cuenta que se va a crear. */
export default function CuentaAccesoStep({
  cuenta,
  errores,
  onChange,
  onNext,
  onBack,
  loading,
  errorBackend,
}: CuentaAccesoStepProps) {
  const [verPassword, setVerPassword] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      {errorBackend && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{errorBackend}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoFocus
          autoComplete="email"
          value={cuenta.email}
          disabled={loading}
          onChange={(e) => onChange("email", e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ahí llega el código de verificación.
        </p>
        {errores.email && <p className="text-xs text-destructive mt-1">{errores.email}</p>}
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={verPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            value={cuenta.password}
            disabled={loading}
            onChange={(e) => onChange("password", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errores.password ? (
          <p className="text-xs text-destructive mt-1">{errores.password}</p>
        ) : (
          <ul className="text-xs text-muted-foreground mt-1 list-disc pl-4 space-y-0.5">
            {REQUISITOS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Label htmlFor="password_confirm">Confirmar contraseña</Label>
        <Input
          id="password_confirm"
          type={verPassword ? "text" : "password"}
          autoComplete="new-password"
          value={cuenta.password_confirm}
          disabled={loading}
          onChange={(e) => onChange("password_confirm", e.target.value)}
        />
        {errores.password_confirm && (
          <p className="text-xs text-destructive mt-1">{errores.password_confirm}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
          Regresar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuar
        </Button>
      </div>
    </form>
  );
}
