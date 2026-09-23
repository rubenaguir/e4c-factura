import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  backendMsg,
  confirmarRegistro,
  iniciarRegistro,
  validarRfc,
  type DatosFiscalesPayload,
} from "@/api/endpoints/registro";
import { usePollEstadoRegistro } from "@/hooks/usePollEstadoRegistro";
import {
  cuentaAccesoSchema,
  datosFiscalesSchema,
  erroresPorCampo,
  verificacionSchema,
  type CuentaAccesoValues,
  type DatosFiscalesValues,
} from "@/lib/registroSchemas";

// ---------------------------------------------------------------------------
// Estado del wizard de alta self-service (§14). La page solo orquesta renders
// (CLAUDE.md #10-b); todo el estado y las 3 llamadas del flujo viven aquí.
// El polling de EstadoRegistro está en usePollEstadoRegistro.
// ---------------------------------------------------------------------------

export type PasoRegistro = 1 | 2 | 3;
export type FaseRegistro = "wizard" | "aprovisionando";

/** Solo se usa si el backend no devolvió `msg` ni `Message` (CLAUDE.md #9). */
const SIN_MENSAJE = "No fue posible continuar con el registro.";

const DATOS_INICIALES: DatosFiscalesValues = {
  rfc: "",
  razon_social: "",
  regimen_fiscal: "",
  codigo_postal: "",
  calle: "",
  no_exterior: "",
  no_interior: "",
  colonia: "",
  municipio: "",
  estado: "",
  pais: "MEX",
};

const CUENTA_INICIAL: CuentaAccesoValues = {
  email: "",
  password: "",
  password_confirm: "",
};

function aPayload(datos: DatosFiscalesValues): DatosFiscalesPayload {
  return {
    rfc: datos.rfc,
    razon_social: datos.razon_social,
    // OJO: `regimen_fiscal`, no `regimen_fiscal_id` (ese es el de Perfil, §13).
    regimen_fiscal: datos.regimen_fiscal,
    codigo_postal: datos.codigo_postal,
    calle: datos.calle,
    no_exterior: datos.no_exterior,
    no_interior: datos.no_interior,
    colonia: datos.colonia,
    municipio: datos.municipio,
    estado: datos.estado,
    pais: datos.pais,
  };
}

export function useRegistroForm() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState<PasoRegistro>(1);
  const [fase, setFase] = useState<FaseRegistro>("wizard");

  // ── Paso 1 ────────────────────────────────────────────────────────────────
  const [datos, setDatos] = useState<DatosFiscalesValues>(DATOS_INICIALES);
  const [erroresDatos, setErroresDatos] = useState<Record<string, string>>({});
  const [validandoRfc, setValidandoRfc] = useState(false);
  const [errorRfc, setErrorRfc] = useState<string | null>(null);
  const [rfcYaRegistrado, setRfcYaRegistrado] = useState(false);

  // ── Paso 2 ────────────────────────────────────────────────────────────────
  const [cuenta, setCuenta] = useState<CuentaAccesoValues>(CUENTA_INICIAL);
  const [erroresCuenta, setErroresCuenta] = useState<Record<string, string>>({});
  const [iniciando, setIniciando] = useState(false);
  const [errorInicio, setErrorInicio] = useState<string | null>(null);
  const [registroId, setRegistroId] = useState<string | null>(null);
  const [msgOtp, setMsgOtp] = useState<string | null>(null);

  // ── Paso 3 ────────────────────────────────────────────────────────────────
  const [codigo, setCodigo] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [erroresVerificacion, setErroresVerificacion] = useState<Record<string, string>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(null);

  // ── Desenlace: aprovisionamiento asíncrono ────────────────────────────────
  const [pollId, setPollId] = useState<string | null>(null);
  const [msgAprovisionando, setMsgAprovisionando] = useState<string | null>(null);
  const estadoAprovisionamiento = usePollEstadoRegistro(pollId, msgAprovisionando);

  const setDato = useCallback((campo: keyof DatosFiscalesValues, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: campo === "rfc" ? valor.toUpperCase() : valor }));
  }, []);

  const setCampoCuenta = useCallback((campo: keyof CuentaAccesoValues, valor: string) => {
    setCuenta((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  /** Paso 1 → 2: valida en cliente y consulta ValidarRFC (formato + unicidad + 69-B). */
  const continuarDesdeDatos = useCallback(async () => {
    const parsed = datosFiscalesSchema.safeParse(datos);
    if (!parsed.success) {
      setErroresDatos(erroresPorCampo(parsed.error));
      return;
    }
    setErroresDatos({});
    setErrorRfc(null);
    setRfcYaRegistrado(false);
    setDatos(parsed.data);
    setValidandoRfc(true);
    try {
      const res = await validarRfc(parsed.data.rfc);
      if (res.yaRegistrado) {
        setRfcYaRegistrado(true);
        setErrorRfc(res.msg ?? SIN_MENSAJE);
        return;
      }
      // `efos` = RFC en lista 69-B (Definitivo o Presunto): no hay forma de continuar en v1.
      if (res.efos || !res.valido) {
        setErrorRfc(res.msg ?? SIN_MENSAJE);
        return;
      }
      setPaso(2);
    } catch (err) {
      setErrorRfc(err instanceof Error ? err.message : SIN_MENSAJE);
    } finally {
      setValidandoRfc(false);
    }
  }, [datos]);

  /** Paso 2 → 3: dispara IniciarRegistro (guarda datos fiscales + email, envía OTP). */
  const continuarDesdeCuenta = useCallback(async () => {
    const parsed = cuentaAccesoSchema(datos.rfc).safeParse(cuenta);
    if (!parsed.success) {
      setErroresCuenta(erroresPorCampo(parsed.error));
      return;
    }
    setErroresCuenta({});
    setErrorInicio(null);
    setCuenta(parsed.data);
    setIniciando(true);
    try {
      const res = await iniciarRegistro(aPayload(datos), parsed.data.email);
      setRegistroId(res.registro_id);
      setMsgOtp(backendMsg(res));
      setCodigo("");
      setErrorConfirmacion(null);
      setPaso(3);
    } catch (err) {
      // Rate limit excedido (5/hora, 10/día por email; 10/hora por IP) llega aquí con su msg.
      setErrorInicio(err instanceof Error ? err.message : SIN_MENSAJE);
    } finally {
      setIniciando(false);
    }
  }, [cuenta, datos]);

  /** Paso 3 → espera: ConfirmarRegistro verifica el OTP y encola el aprovisionamiento. */
  const confirmar = useCallback(async () => {
    if (!registroId) return;
    const parsed = verificacionSchema.safeParse({ codigo, acepta_terminos: aceptaTerminos });
    if (!parsed.success) {
      setErroresVerificacion(erroresPorCampo(parsed.error));
      return;
    }
    setErroresVerificacion({});
    setErrorConfirmacion(null);
    setConfirmando(true);
    try {
      const res = await confirmarRegistro(registroId, parsed.data.codigo, cuenta.password);
      if (res.estatus === "ERROR") {
        setErrorConfirmacion(backendMsg(res) ?? SIN_MENSAJE);
        return;
      }
      setMsgAprovisionando(backendMsg(res));
      setPollId(res.registro_id ?? registroId);
      setFase("aprovisionando");
    } catch (err) {
      // Código incorrecto / expirado / intentos agotados: msg del backend.
      setErrorConfirmacion(err instanceof Error ? err.message : SIN_MENSAJE);
    } finally {
      setConfirmando(false);
    }
  }, [aceptaTerminos, codigo, cuenta.password, registroId]);

  const volver = useCallback(() => {
    setPaso((prev) => (prev === 3 ? 2 : 1));
  }, []);

  /** Reintento tras `estatus: "ERROR"`: vuelve al paso 1 conservando lo capturado. */
  const reiniciar = useCallback(() => {
    setPollId(null);
    setMsgAprovisionando(null);
    setRegistroId(null);
    setCodigo("");
    setAceptaTerminos(false);
    setErrorConfirmacion(null);
    setErrorInicio(null);
    setErrorRfc(null);
    setRfcYaRegistrado(false);
    setFase("wizard");
    setPaso(1);
  }, []);

  const irALogin = useCallback(() => navigate("/login", { replace: true }), [navigate]);

  // COMPLETADO → /login con el usuario prellenado (nunca auto-login, 08-decisions #18).
  useEffect(() => {
    const completado = estadoAprovisionamiento.completado;
    if (!completado) return;
    navigate("/login", {
      replace: true,
      state: {
        prefillUsuario: completado.usuario_id ?? "",
        successMessage: backendMsg(completado) ?? "Tu cuenta está lista. Inicia sesión.",
      },
    });
  }, [estadoAprovisionamiento.completado, navigate]);

  return {
    paso,
    fase,
    datos,
    setDato,
    erroresDatos,
    validandoRfc,
    errorRfc,
    rfcYaRegistrado,
    cuenta,
    setCampoCuenta,
    erroresCuenta,
    iniciando,
    errorInicio,
    msgOtp,
    codigo,
    setCodigo,
    aceptaTerminos,
    setAceptaTerminos,
    erroresVerificacion,
    confirmando,
    errorConfirmacion,
    estadoAprovisionamiento,
    continuarDesdeDatos,
    continuarDesdeCuenta,
    confirmar,
    volver,
    reiniciar,
    irALogin,
  };
}
