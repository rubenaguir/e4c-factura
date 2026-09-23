import { useEffect, useState } from "react";
import {
  backendMsg,
  estadoRegistro,
  type EstadoRegistroResponse,
  type EstatusRegistro,
} from "@/api/endpoints/registro";

// ---------------------------------------------------------------------------
// Polling del aprovisionamiento (§14 Paso 4). El worker de InstanceManager
// corre por cron cada 5 min, hasta 3 intentos → peor caso ≈ 15 min.
// ---------------------------------------------------------------------------

/** 0–60 s: el caso típico resuelve en el primer tick del cron. */
const POLL_RAPIDO_MS = 3_000;
/** 60 s–17 min: evita cientos de requests durante una espera larga. */
const POLL_LENTO_MS = 20_000;
const FASE_RAPIDA_MS = 60_000;
/** Tope de espera del cliente: 15 min de peor caso + margen. */
const TOPE_MS = 17 * 60 * 1000;
/** Fallos de red seguidos tolerados antes de rendirse (un 500 permanente no debe latir 17 min). */
const MAX_ERRORES_SEGUIDOS = 5;

export interface EstadoPolling {
  estatus: EstatusRegistro | null;
  /** `msg` del backend — el texto mostrado nunca se arma aquí (CLAUDE.md #9). */
  msg: string | null;
  /** Respuesta completa cuando `estatus === "COMPLETADO"` (trae `usuario_id`). */
  completado: EstadoRegistroResponse | null;
  /** Se alcanzó el tope de 17 min sin COMPLETADO/ERROR. */
  expirado: boolean;
  /** Error de transporte persistente (mensaje del backend cuando lo hay). */
  error: string | null;
}

function estadoInicial(msgInicial: string | null, activo: boolean): EstadoPolling {
  return {
    estatus: activo ? "APROVISIONANDO" : null,
    msg: msgInicial,
    completado: null,
    expirado: false,
    error: null,
  };
}

/**
 * Consulta `EstadoRegistro` hasta COMPLETADO / ERROR / tope de espera.
 * Inactivo mientras `registroId` sea null.
 */
export function usePollEstadoRegistro(
  registroId: string | null,
  msgInicial: string | null
): EstadoPolling {
  const [estado, setEstado] = useState<EstadoPolling>(() =>
    estadoInicial(msgInicial, registroId !== null)
  );

  useEffect(() => {
    if (!registroId) {
      setEstado(estadoInicial(null, false));
      return;
    }

    setEstado(estadoInicial(msgInicial, true));

    let cancelado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let erroresSeguidos = 0;
    const inicio = Date.now();

    const siguienteDelay = () =>
      Date.now() - inicio < FASE_RAPIDA_MS ? POLL_RAPIDO_MS : POLL_LENTO_MS;

    const tick = async () => {
      try {
        const res = await estadoRegistro(registroId);
        if (cancelado) return;
        erroresSeguidos = 0;
        setEstado({
          estatus: res.estatus,
          msg: backendMsg(res),
          completado: res.estatus === "COMPLETADO" ? res : null,
          expirado: false,
          error: null,
        });
        if (res.estatus === "COMPLETADO" || res.estatus === "ERROR") return;
      } catch (err) {
        if (cancelado) return;
        erroresSeguidos += 1;
        if (erroresSeguidos >= MAX_ERRORES_SEGUIDOS) {
          setEstado((prev) => ({
            ...prev,
            error: err instanceof Error ? err.message : "Error desconocido",
          }));
          return;
        }
      }

      if (Date.now() - inicio >= TOPE_MS) {
        setEstado((prev) => ({ ...prev, expirado: true }));
        return;
      }
      timer = setTimeout(tick, siguienteDelay());
    };

    timer = setTimeout(tick, POLL_RAPIDO_MS);

    return () => {
      cancelado = true;
      if (timer) clearTimeout(timer);
    };
    // msgInicial solo siembra el texto de la primera pantalla; no debe reiniciar el polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroId]);

  return estado;
}
