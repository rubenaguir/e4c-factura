import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGIMEN_FISCAL_SAT_RECORDS } from "@/api/endpoints/lovs";
import type { DatosFiscalesValues } from "@/lib/registroSchemas";

interface DatosFiscalesStepProps {
  datos: DatosFiscalesValues;
  errores: Record<string, string>;
  onChange: (campo: keyof DatosFiscalesValues, valor: string) => void;
  onNext: () => void;
  loading: boolean;
  /** `msg` del backend cuando ValidarRFC rechaza (69-B, ya registrado, formato). */
  errorBackend: string | null;
  /** El RFC ya tiene instancia: se ofrece ir a /login. */
  yaRegistrado: boolean;
}

function CampoError({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-xs text-destructive mt-1">{mensaje}</p>;
}

/** Paso 1 del registro: datos fiscales + validación de RFC contra el backend. */
export default function DatosFiscalesStep({
  datos,
  errores,
  onChange,
  onNext,
  loading,
  errorBackend,
  yaRegistrado,
}: DatosFiscalesStepProps) {
  const [mostrarDomicilio, setMostrarDomicilio] = useState(() =>
    Boolean(
      datos.calle ||
        datos.no_exterior ||
        datos.no_interior ||
        datos.colonia ||
        datos.municipio ||
        datos.estado
    )
  );

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
          <AlertDescription className="whitespace-pre-line">
            {errorBackend}
            {yaRegistrado && (
              <Link to="/login" className="block mt-2 underline font-medium">
                Iniciar sesión
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="rfc">RFC</Label>
        <Input
          id="rfc"
          autoFocus
          autoComplete="off"
          maxLength={13}
          value={datos.rfc}
          disabled={loading}
          onChange={(e) => onChange("rfc", e.target.value)}
        />
        <CampoError mensaje={errores.rfc} />
      </div>

      <div>
        <Label htmlFor="razon_social">Razón social</Label>
        <Input
          id="razon_social"
          value={datos.razon_social}
          disabled={loading}
          onChange={(e) => onChange("razon_social", e.target.value)}
        />
        <CampoError mensaje={errores.razon_social} />
      </div>

      <div>
        <Label htmlFor="regimen_fiscal">Régimen fiscal</Label>
        <Select
          value={datos.regimen_fiscal}
          disabled={loading}
          onValueChange={(v) => onChange("regimen_fiscal", v)}
        >
          <SelectTrigger id="regimen_fiscal">
            <SelectValue placeholder="Selecciona…" />
          </SelectTrigger>
          <SelectContent>
            {REGIMEN_FISCAL_SAT_RECORDS.map((r) => (
              <SelectItem key={r.regimen_fiscal_id} value={r.regimen_fiscal_id}>
                {r.regimen_fiscal_id} — {r.regimen}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CampoError mensaje={errores.regimen_fiscal} />
      </div>

      <div>
        <button
          type="button"
          className="text-sm text-primary hover:underline flex items-center gap-1"
          onClick={() => setMostrarDomicilio((v) => !v)}
        >
          {mostrarDomicilio ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Domicilio fiscal (opcional)
        </button>
        {mostrarDomicilio && (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3">
              <div>
                <Label htmlFor="calle">Calle</Label>
                <Input
                  id="calle"
                  value={datos.calle}
                  disabled={loading}
                  onChange={(e) => onChange("calle", e.target.value)}
                />
                <CampoError mensaje={errores.calle} />
              </div>
              <div className="w-20">
                <Label htmlFor="no_exterior">No. ext.</Label>
                <Input
                  id="no_exterior"
                  value={datos.no_exterior}
                  disabled={loading}
                  onChange={(e) => onChange("no_exterior", e.target.value)}
                />
              </div>
              <div className="w-20">
                <Label htmlFor="no_interior">No. int.</Label>
                <Input
                  id="no_interior"
                  value={datos.no_interior}
                  disabled={loading}
                  onChange={(e) => onChange("no_interior", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="colonia">Colonia</Label>
              <Input
                id="colonia"
                value={datos.colonia}
                disabled={loading}
                onChange={(e) => onChange("colonia", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="municipio">Municipio</Label>
              <Input
                id="municipio"
                value={datos.municipio}
                disabled={loading}
                onChange={(e) => onChange("municipio", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={datos.estado}
                disabled={loading}
                onChange={(e) => onChange("estado", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="codigo_postal">Código postal</Label>
        <Input
          id="codigo_postal"
          inputMode="numeric"
          maxLength={5}
          value={datos.codigo_postal}
          disabled={loading}
          onChange={(e) => onChange("codigo_postal", e.target.value)}
        />
        <CampoError mensaje={errores.codigo_postal} />
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Select
          value={datos.pais}
          disabled={loading}
          onValueChange={(v) => onChange("pais", v)}
        >
          <SelectTrigger id="pais">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEX">México</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continuar
      </Button>
    </form>
  );
}
