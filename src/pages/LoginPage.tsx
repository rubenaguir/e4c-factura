import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { SucursalOption } from "@/api/endpoints/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnackbar } from "@/context/useSnackbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Paso 1: credenciales ────────────────────────────────────────────────────
const step1Schema = z.object({
  usuario: z.string().min(1, "Usuario requerido"),
  contrasena: z.string().min(1, "Contraseña requerida"),
});
type Step1Values = z.infer<typeof step1Schema>;

// ── Paso 2: selección de sucursal ───────────────────────────────────────────
const step2Schema = z.object({
  empresaId: z.string().min(0),
  sucursalId: z.string().min(1, "Selecciona una empresa/sucursal"),
});
type Step2Values = z.infer<typeof step2Schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { getSucursales, login, hasBiometric, loginWithBiometric } = useAuth();

  const { showError } = useSnackbar();
  const [step, setStep] = useState<1 | 2>(1);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [credenciales, setCredenciales] = useState<Step1Values | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Formulario paso 1 ────────────────────────────────────────────────────
  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { usuario: "", contrasena: "" },
  });

  const onStep1Submit = async (values: Step1Values) => {
    setLoading(true);
    try {
      const opciones = await getSucursales(values.usuario, values.contrasena);
      if (opciones.length === 0) {
        showError("No hay empresas/sucursales disponibles para este usuario.");
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
      showError(e instanceof Error ? e.message : "Error desconocido");
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
    setLoading(true);
    try {
      await login(credenciales.usuario, credenciales.contrasena, values.empresaId, values.sucursalId);
      navigate("/", { replace: true });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSucursalSelect = (s: SucursalOption) => {
    // form2.setValue("empresaId", s.empresa_id);
    form2.setValue("sucursalId", s.empresa_sucursal_id);
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      await loginWithBiometric();
      navigate("/", { replace: true });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const volverAPaso1 = () => {
    setStep(1);
    setSucursales([]);
    setCredenciales(null);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Fondo vertical (portrait) */}
      <div
        className="absolute inset-0 landscape:hidden"
        style={{ backgroundImage: "url('images/login-bg-v2.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      {/* Fondo horizontal / desktop (landscape) */}
      <div
        className="absolute inset-0 portrait:hidden"
        style={{ backgroundImage: "url('images/login-bg-h2.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      {/* Overlay oscuro para contraste */}
      <div className="absolute inset-0 bg-black/45" />

      <Card className="relative w-full max-w-sm shadow-[0_25px_50px_-6px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg brand-gradient flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">E4</span>
            </div>
            <CardTitle className="text-xl brand-gradient-text">E4C Facturación</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {step === 1 ? "Ingresa tus credenciales" : "Selecciona empresa y sucursal"}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
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
                <div className="relative">
                  <Input
                    id="contrasena"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={loading}
                    className="pr-10"
                    {...form1.register("contrasena")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form1.formState.errors.contrasena && (
                  <p className="text-xs text-destructive">{form1.formState.errors.contrasena.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>

              {hasBiometric && (
                <>
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-border" />
                    <span className="mx-3 text-xs text-muted-foreground">o</span>
                    <div className="flex-grow border-t border-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleBiometricLogin}
                    disabled={loading}
                  >
                    <Fingerprint className="h-4 w-4" />
                    Entrar con huella
                  </Button>
                </>
              )}
            </form>
          )}

          {/* ── Paso 2 ── */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="space-y-2">
                {sucursales.map((s) => {
                  const selected =
                    // form2.watch("empresaId") === s.empresa_id &&
                    form2.watch("sucursalId") === s.empresa_sucursal_id;
                  return (
                    <button
                      key={`${s.empresa_sucursal_id}`}
                      type="button"
                      onClick={() => handleSucursalSelect(s)}
                      className={[
                        "w-full text-left rounded-md border p-3 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted",
                      ].join(" ")}
                    >
                      <p className="font-medium">{s.descripcion}</p>
                      {/* <p className="text-xs text-muted-foreground">{s.empresa_sucursal_id}</p> */}
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
                <Button type="submit" className="flex-1" disabled={loading || !form2.watch("sucursalId")}>
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
