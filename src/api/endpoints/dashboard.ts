import { apiCall } from "@/api/client";

const MODULE = "ventas:facturas_venta_33:dashboard_pwa";

export interface MontoFacturadoResponse {
  success: boolean;
  mes_actual: string;
  mes_anterior: string;
}

export interface PorCobrarResponse {
  success: boolean;
  mes_actual: string;
  mes_anterior: string;
}

export interface AntiguedadSaldosResponse {
  success: boolean;
  saldo_0: string;
  saldo_1_30: string;
  saldo_31_60: string;
  saldo_61_90: string;
  saldo_91: string;
  saldo_total: string;
}

export interface IngresosResponse {
  success: boolean;
  mes_actual: string;
  mes_anterior: string;
}

export interface CancelacionPendiente {
  serie: string;
  folio: string;
  fecha: string;
  receptor_nombre: string;
  total: string;
  estatus: string;
  estatus_cancelacion: string;
}

export interface CancelacionesPendientesResponse {
  success: boolean;
  records: CancelacionPendiente[];
}

export const getMontoFacturado = () =>
  apiCall<MontoFacturadoResponse>(`${MODULE}:GetMontoFacturado`);

export const getPorCobrar = () =>
  apiCall<PorCobrarResponse>(`${MODULE}:GetPorCobrar`);

export const getIngresos = () =>
  apiCall<IngresosResponse>(`${MODULE}:GetIngresos`);

export const getAntiguedadSaldos = () =>
  apiCall<AntiguedadSaldosResponse>(`${MODULE}:GetAntiguedadSaldos`);

export const getCancelacionesPendientes = () =>
  apiCall<CancelacionesPendientesResponse>(`${MODULE}:GetCancelacionesPendientes`);
