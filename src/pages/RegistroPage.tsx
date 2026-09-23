import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AprovisionandoScreen from "@/components/registro/AprovisionandoScreen";
import CuentaAccesoStep from "@/components/registro/CuentaAccesoStep";
import DatosFiscalesStep from "@/components/registro/DatosFiscalesStep";
import RegistroProgress from "@/components/registro/RegistroProgress";
import VerificacionStep from "@/components/registro/VerificacionStep";
import { useRegistroForm } from "@/hooks/useRegistroForm";
import logoEmpresa4Cero from "@/assets/empresa4cero-logo.svg";

const SUBTITULOS: Record<1 | 2 | 3, string> = {
  1: "Datos fiscales de tu empresa",
  2: "Crea tu cuenta de acceso",
  3: "Verifica tu correo",
};

/** Alta self-service (§14). Ruta pública, fuera de AppShell y sin AuthContext. */
export default function RegistroPage() {
  const form = useRegistroForm();
  const esperando = form.fase === "aprovisionando";

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md my-4 shadow-lg">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <img src={logoEmpresa4Cero} alt="Empresa4Cero" className="h-9 w-9" />
            <CardTitle className="text-xl brand-gradient-text">Crear cuenta</CardTitle>
          </div>
          {!esperando && (
            <>
              <RegistroProgress paso={form.paso} />
              <p className="text-sm text-muted-foreground">{SUBTITULOS[form.paso]}</p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {esperando && (
            <AprovisionandoScreen
              estado={form.estadoAprovisionamiento}
              onReintentar={form.reiniciar}
              onIrALogin={form.irALogin}
            />
          )}

          {!esperando && form.paso === 1 && (
            <DatosFiscalesStep
              datos={form.datos}
              errores={form.erroresDatos}
              onChange={form.setDato}
              onNext={form.continuarDesdeDatos}
              loading={form.validandoRfc}
              errorBackend={form.errorRfc}
              yaRegistrado={form.rfcYaRegistrado}
            />
          )}

          {!esperando && form.paso === 2 && (
            <CuentaAccesoStep
              cuenta={form.cuenta}
              errores={form.erroresCuenta}
              onChange={form.setCampoCuenta}
              onNext={form.continuarDesdeCuenta}
              onBack={form.volver}
              loading={form.iniciando}
              errorBackend={form.errorInicio}
            />
          )}

          {!esperando && form.paso === 3 && (
            <VerificacionStep
              email={form.cuenta.email}
              msgOtp={form.msgOtp}
              codigo={form.codigo}
              onCodigoChange={form.setCodigo}
              aceptaTerminos={form.aceptaTerminos}
              onAceptaTerminosChange={form.setAceptaTerminos}
              errores={form.erroresVerificacion}
              onSubmit={form.confirmar}
              onBack={form.volver}
              loading={form.confirmando}
              errorBackend={form.errorConfirmacion}
            />
          )}

          {!esperando && (
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary underline font-medium">
                Inicia sesión
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
