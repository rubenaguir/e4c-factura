import { apiCall } from "@/api/client";

const MODULE = "ventas:facturas_venta_33:dashboard_pwa";

export interface MontoFacturadoResponse {
  success: boolean;
  mes_actual: string;
  mes_anterior: string;
}

export interface PorCobrarResponse {
  success: boolean;
  total: string;
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

export const getCancelacionesPendientes = () =>
  apiCall<CancelacionesPendientesResponse>(`${MODULE}:GetCancelacionesPendientes`);
