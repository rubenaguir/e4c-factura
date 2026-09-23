import { apiCall } from "@/api/client";

// ---------------------------------------------------------------------------
// Alta self-service (§14). Los 4 opReq viajan sin `session` — SisnetV3 los
// reenvía 1:1 a InstanceManager (ver docs/spec/14-alta-self-service.md §Contrato).
// No hay cliente nuevo: mismo apiCall, mismo VITE_API_BASE_URL.
// ---------------------------------------------------------------------------

const OP = "seguri:registro:registro";

/** Booleanos del backend PHP: pueden llegar como bool, "1"/"0", "S"/"N" o "true". */
function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "s" || v === "si" || v === "sí";
  }
  return false;
}

export interface ValidarRfcResponse {
  rfc: string;
  valido: unknown;
  ya_registrado: unknown;
  /** Estatus 69-B: "Definitivo" | "Presunto" | null | false según InstanceManager. */
  efos: unknown;
  msg?: string;
  Message?: string;
}

export interface ValidarRfcResult {
  valido: boolean;
  yaRegistrado: boolean;
  /** Texto del estatus 69-B cuando el RFC aparece en la lista; null si no aparece. */
  efos: string | null;
  msg: string | null;
}

export interface DatosFiscalesPayload {
  rfc: string;
  razon_social: string;
  /** OJO: en `UpdateBasicData` (Perfil) este campo es `regimen_fiscal_id`. Aquí NO. */
  regimen_fiscal: string;
  codigo_postal: string;
  calle: string;
  no_exterior: string;
  no_interior: string;
  colonia: string;
  municipio: string;
  estado: string;
  pais: string;
}

export interface IniciarRegistroResponse {
  registro_id: string;
  msg?: string;
  Message?: string;
}

export type EstatusRegistro = "APROVISIONANDO" | "COMPLETADO" | "ERROR";

export interface EstadoRegistroResponse {
  registro_id: string;
  estatus: EstatusRegistro;
  /** Solo en COMPLETADO */
  instancia_id?: string;
  nombre_sesion?: string;
  usuario_id?: string;
  msg?: string;
  Message?: string;
}

/** Mensaje del backend, nunca hardcodeado (CLAUDE.md #9). */
export function backendMsg(res: { msg?: string; Message?: string }): string | null {
  return res.msg ?? res.Message ?? null;
}

/** Formato + unicidad + 69-B/EFOS. Normaliza los booleanos del backend. */
export async function validarRfc(rfc: string): Promise<ValidarRfcResult> {
  const res = await apiCall<ValidarRfcResponse>(`${OP}:ValidarRFC`, { rfc });

  const efosRaw = res.efos;
  const efos =
    typeof efosRaw === "string" && efosRaw.trim() !== "" && efosRaw.trim().toLowerCase() !== "n"
      ? efosRaw.trim()
      : toBool(efosRaw)
        ? "69-B"
        : null;

  return {
    valido: toBool(res.valido),
    yaRegistrado: toBool(res.ya_registrado),
    efos,
    msg: backendMsg(res),
  };
}

/** Guarda datos fiscales + email y dispara el envío del OTP. */
export function iniciarRegistro(
  datos: DatosFiscalesPayload,
  email: string
): Promise<IniciarRegistroResponse> {
  return apiCall<IniciarRegistroResponse>(`${OP}:IniciarRegistro`, {
    ...datos,
    email,
  });
}

/** Verifica el OTP y encola el aprovisionamiento (responde en <1s). */
export function confirmarRegistro(
  registroId: string,
  codigo: string,
  contrasena: string
): Promise<EstadoRegistroResponse> {
  return apiCall<EstadoRegistroResponse>(`${OP}:ConfirmarRegistro`, {
    registro_id: registroId,
    codigo,
    contrasena,
  });
}

/** Estado del aprovisionamiento asíncrono (worker por cron en InstanceManager). */
export function estadoRegistro(registroId: string): Promise<EstadoRegistroResponse> {
  return apiCall<EstadoRegistroResponse>(`${OP}:EstadoRegistro`, {
    registro_id: registroId,
  });
}
