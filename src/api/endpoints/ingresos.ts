import { apiCall } from "@/api/client";

const MODULE = "tesoreria:registro_ingresos_33:registro_ingresos";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClienteIngresosLov {
  cliente_id: string;
  rfc: string;
  nombre: string;
  codigo_postal: string;
  regimen_fiscal_id: string;
  banco_id: string | null;
  banco_descr: string | null;
  sat_cta_ori: string | null;
  sat_banco_dest: string | null;
  sat_banco_dest_descr: string | null;
  sat_cta_dest: string | null;
}

export interface CuentaBancaria {
  banco_id: string;
  banco_descr: string;
  sat_cta_ori: string;
}

export interface CuentaCobrar {
  num_cta_cobrar: string;
  importe?: string;           // importe pagado — presente en Load.cuentas_cobrar
  descripcion: string;
  fecha: string;
  fecha_creacion: string;
  fecha_vencimiento: string;
  moneda_id: string;
  tipo_cambio: string;
  subtotal: string;
  impuestos_ret: string;
  impuestos_tras: string;
  total: string;
  total_moneda_base: string;
  saldo: string;
  saldo_moneda_base: string;
  cliente_id: string;
  rfc: string;
  nombre: string;
  documento: string;
  documento_serie: string;
  documento_folio: string;
  documento_descr: string;
  estatus: string;
  metodo_pago_sat33?: string;   // "PUE" | "PPD" — solo en SearchCuentasCobrar
  tipo_cambio_pago?: string;    // solo en Load.cuentas_cobrar
}

export interface IngresoRow {
  start: string;
  empresa_id: string;
  sucursal_id: string;
  fecha: string;
  fecha_hora_registro: string;
  fecha_pago: string;
  fecha_registro: string;
  serie: string;
  folio: string;
  fact_serie_folio: string;
  comprobante_fisico: string | null;
  cliente_id: string;
  rfc: string;
  nombre: string;
  descripcion: string;
  moneda_id: string;
  tipo_cambio: string;
  importe: string;
  metodo_pago_id: string;
  metodo_pago_descr: string;
  banco_id: string;
  banco_descr: string;
  no_autorizacion: string | null;
  referencia: string | null;
  estatus: string;                  // "R" | "C"
  actualizacion_usuario_id: string;
  cancelacion_estatus: string | null;
  actualizacion_fecha: string;
  fecha_timbrado: string | null;
  uuid: string | null;
  timbrado_posterior: string;       // "S" | "N"
  num_poliza: string | null;
}

export interface IngresoDetalle {
  empresa_id: string;
  serie: string;
  folio: string;
  sucursal_id: string;
  cliente_id: string;
  fecha: string;
  fecha_pago: string;
  metodo_pago_id: string;
  forma_pago: string;
  forma_pago_descr: string;
  metodo_pago_descr: string;
  sat_cta_ori: string;
  sat_banco_ori: string;
  sat_cta_dest: string;
  sat_banco_dest: string;
  sat_banco_dest_descr: string;
  importe: string;
  tipo_cambio: string;
  moneda_id: string;
  rfc: string;
  nombre: string;
  banco_id: string;
  banco_descr: string;
  uuid: string | null;
  estatus: string;                  // "R" | "C"
  actualizacion_usuario_id: string;
  actualizacion_fecha: string;
  cancelacion_estatus?: string | null;
  descripcion?: string;
  cuentas_cobrar: { totalCount: number; records: CuentaCobrar[] };
  sat_estatus: string;
}

export interface IngresoSearchParams {
  fecha_inicial?: string;
  fecha_final?: string;
  fecha_inicial_pago?: string;
  fecha_final_pago?: string;
  rfc?: string;
  nombre?: string;
  serie?: string;
  folio?: string;
  fact_serie_folio?: string;
  descripcion?: string;
  no_autorizacion?: string;
  referencia?: string;
  banco_id?: string;
  estatus?: string;
  start?: number;
  limit?: number;
}

export interface CuentaCobrarPayload {
  num_cta_cobrar: string;
  importe: string;
  moneda_id: string;
  tipo_cambio: string;
  documento: string;
  documento_serie: string;
  documento_folio: string;
  tipo_cambio_pago: string;
}

export interface IngresoAddPayload {
  serie: string;
  folio: string;
  observaciones: string;
  estatus_sat: string;
  fecha_pago: string;              // "DD/MM/YYYY HH:mm:ss"
  cliente_id: string;
  nombre: string;
  rfc: string;
  receptor_regimen_fiscal_id: string;
  codigo_postal: string;
  descripcion: string;
  moneda_id: string;
  tipo_cambio: string;
  forma_pago: string;
  forma_pago_descr: string;
  importe: string;
  no_autorizacion: string;
  referencia: string;
  fecha: string;
  banco_id: string;
  banco_descr: string;
  sat_cta_ori: string;
  sat_banco_dest: string;
  sat_banco_dest_descr: string;
  sat_cta_dest: string;
  cuentas_cobrar: CuentaCobrarPayload[];
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export function searchIngresos(params: IngresoSearchParams) {
  return apiCall<{ totalCount: number; records: IngresoRow[] }>(
    `${MODULE}:Search`,
    params as Record<string, unknown>
  );
}

export function loadIngreso(serie: string, folio: string) {
  return apiCall<IngresoDetalle>(`${MODULE}:Load`, { serie, folio });
}

export function loadLovFieldClientesIngresos(pageSize = 500) {
  return apiCall<{ totalCount: number; records: ClienteIngresosLov[] }>(
    `${MODULE}:LoadLovFieldClientes`,
    { pageSize }
  );
}

export function searchClientesForIngresos(query: string) {
  return apiCall<{ totalCount: number; records: Array<{ cliente_id: string; nombre: string; rfc: string }> }>(
    "ventas:clientes:clientes:Search",
    { nombre: query, estatus: "A", tipo_cliente_deudor: "CLIENTE", limit: 20, start: 0 }
  );
}

export function validateLovFieldClientesIngresos(clienteId: string) {
  return apiCall<ClienteIngresosLov>(
    `${MODULE}:ValidateLovFieldClientes`,
    { cliente_id: clienteId }
  );
}

export function searchCuentasBancariasCliente(clienteId: string) {
  return apiCall<{ records: CuentaBancaria[] }>(
    `${MODULE}:SearchCuentasBancariasCliente`,
    { cliente_id: clienteId }
  );
}

export function searchCuentasCobrar(clienteId: string) {
  return apiCall<{ totalCount: number; records: CuentaCobrar[] }>(
    `${MODULE}:SearchCuentasCobrar`,
    { cliente_id: clienteId }
  );
}

export function addIngreso(payload: IngresoAddPayload) {
  return apiCall<{ msg: string; record: IngresoDetalle }>(
    `${MODULE}:Add`,
    payload as unknown as Record<string, unknown>
  );
}

export function stampIngreso(serie: string, folio: string) {
  return apiCall<{ msg: string; log: string; record: IngresoDetalle }>(
    `${MODULE}:Stamp`,
    { serie, folio }
  );
}

export function cancelIngreso(serie: string, folio: string, motivo: string) {
  return apiCall<{ msg: string; log: string; record: IngresoDetalle }>(
    `${MODULE}:Cancel33`,
    { serie, folio, motivo }
  );
}

export function sendMailIngreso(
  serie: string,
  folio: string,
  nombre: string,
  correo: string
) {
  return apiCall<{ msg: string; log: string }>(
    `${MODULE}:SendMail`,
    { serie, folio, nombre, correo }
  );
}

export async function printPdfIngreso(serie: string, folio: string): Promise<Blob> {
  const session = localStorage.getItem("sv3_session") ?? "";
  const base = import.meta.env.VITE_API_BASE_URL as string;
  const params = new URLSearchParams({
    opReq: `${MODULE}:PrintPdf`,
    session,
    serie,
    folio,
  });
  const response = await fetch(`${base}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.blob();
}
