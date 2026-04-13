import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { SucursalOption } from "@/api/endpoints/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Paso 1: credenciales ────────────────────────────────────────────────────
const step1Schema = z.object({
  usuario: z.string().min(1, "Usuario requerido"),
  contrasena: z.string().min(1, "Contraseña requerida"),
});
type Step1Values = z.infer<typeof step1Schema>;

// ── Paso 2: selección de sucursal ───────────────────────────────────────────
const step2Schema = z.object({
  empresaId: z.string().min(1, "Selecciona una empresa/sucursal"),
  sucursalId: z.string().min(1),
});
type Step2Values = z.infer<typeof step2Schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { getSucursales, login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [credenciales, setCredenciales] = useState<Step1Values | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Formulario paso 1 ────────────────────────────────────────────────────
  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { usuario: "", contrasena: "" },
  });

  const onStep1Submit = async (values: Step1Values) => {
    debugger;
    setError(null);
    setLoading(true);
    try {
      const opciones = await getSucursales(values.usuario, values.contrasena);
      if (opciones.length === 0) {
        setError("No hay empresas/sucursales disponibles para este usuario.");
        return;
      }
      if (opciones.length === 1) {
        // Auto-login directo
        await login(values.usuario, values.contrasena, opciones[0].empresa_id, opciones[0].sucursal_id);
        navigate("/", { replace: true });
        return;
      }
      setCredenciales(values);
      setSucursales(opciones);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // ── Formulario paso 2 ────────────────────────────────────────────────────
  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { empresaId: "", sucursalId: "" },
  });

  const onStep2Submit = async (values: Step2Values) => {
    if (!credenciales) return;
    setError(null);
    setLoading(true);
    try {
      await login(credenciales.usuario, credenciales.contrasena, values.empresaId, values.sucursalId);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSucursalSelect = (s: SucursalOption) => {
    form2.setValue("empresaId", s.empresa_id);
    form2.setValue("sucursalId", s.sucursal_id);
  };

  const volverAPaso1 = () => {
    setStep(1);
    setError(null);
    setSucursales([]);
    setCredenciales(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E4</span>
            </div>
            <CardTitle className="text-xl">E4C Facturación</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {step === 1 ? "Ingresa tus credenciales" : "Selecciona empresa y sucursal"}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Paso 1 ── */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  autoComplete="username"
                  disabled={loading}
                  {...form1.register("usuario")}
                />
                {form1.formState.errors.usuario && (
                  <p className="text-xs text-destructive">{form1.formState.errors.usuario.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  autoComplete="current-password"
                  disabled={loading}
                  {...form1.register("contrasena")}
                />
                {form1.formState.errors.contrasena && (
                  <p className="text-xs text-destructive">{form1.formState.errors.contrasena.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </form>
          )}

          {/* ── Paso 2 ── */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="space-y-2">
                {sucursales.map((s) => {
                  const selected =
                    form2.watch("empresaId") === s.empresa_id &&
                    form2.watch("sucursalId") === s.sucursal_id;
                  return (
                    <button
                      key={`${s.empresa_id}-${s.sucursal_id}`}
                      type="button"
                      onClick={() => handleSucursalSelect(s)}
                      className={[
                        "w-full text-left rounded-md border p-3 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted",
                      ].join(" ")}
                    >
                      <p className="font-medium">{s.empresa_nombre}</p>
                      <p className="text-xs text-muted-foreground">{s.sucursal_nombre}</p>
                    </button>
                  );
                })}
                {form2.formState.errors.empresaId && (
                  <p className="text-xs text-destructive">Selecciona una sucursal</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={volverAPaso1} disabled={loading}>
                  Regresar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !form2.watch("empresaId")}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
