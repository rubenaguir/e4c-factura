import { apiCall } from "@/api/client";

// ---------------------------------------------------------------------------
// Raw record shapes returned by each LOV endpoint
// ---------------------------------------------------------------------------

export interface UsoCfdiRecord {
  uso_id: string;
  descripcion: string;
  persona_fisica: string; // "S" | "N"
  persona_moral: string;  // "S" | "N"
}

export interface FormaPagoRecord {
  clave: string;
  descripcion: string;
}

export interface MetodoPagoRecord {
  clave: string;
  descripcion: string;
}

export interface RegimenFiscalRecord {
  regimen_fiscal_id: string;
  regimen: string;
}

export interface MonedaRecord {
  moneda_id: string;
  descripcion: string;
  tipo_cambio: string;    // decimal string, ej. "1.000000"
  decimales_sat: string;
}

export interface UnidadMedidaRecord {
  unidad_id: string;
  descripcion: string;
  simbolo: string;
}

export interface ObjetoImpuestoRecord {
  clave: string;
  descripcion: string;
}

// ---------------------------------------------------------------------------
// Catalogo name union — used as keys throughout CatalogosContext
// ---------------------------------------------------------------------------

export type CatalogName =
  | "usoCfdi"
  | "formaPago"
  | "metodoPago"
  | "regimenFiscal"
  | "moneda"
  | "unidadMedida"
  | "objetoImpuesto";

// ---------------------------------------------------------------------------
// Static data (no backend endpoint)
// ---------------------------------------------------------------------------

export const OBJETO_IMPUESTO_RECORDS: ObjetoImpuestoRecord[] = [
  { clave: "01", descripcion: "No objeto de impuesto" },
  { clave: "02", descripcion: "Sí objeto de impuesto" },
  { clave: "03", descripcion: "Sí objeto del impuesto y no obligado al desglose" },
  { clave: "04", descripcion: "Sí objeto del impuesto y no causa impuesto" },
  { clave: "05", descripcion: "Sí objeto del impuesto, IVA crédito PODEBI" },
];

// ---------------------------------------------------------------------------
// Async fetch helpers — one per catalog
// Real opReq names taken from PHP backend function names in php/library/lov/
// ---------------------------------------------------------------------------

async function fetchList<T>(
  opReq: string,
  params: Record<string, string | number> = {}
): Promise<T[]> {
  const res = await apiCall<{ totalCount: number; records: T[] }>(opReq, params);
  return res.records ?? [];
}

export function loadUsoCfdi(): Promise<UsoCfdiRecord[]> {
  return fetchList("Lov:Lov:Lov:LoadLovFieldUsosComprobantesSat");
}

export function loadFormaPago(): Promise<FormaPagoRecord[]> {
  return fetchList("Lov:Lov:Lov:LoadLovFieldFormasPagoSat33");
}

export function loadMetodoPago(): Promise<MetodoPagoRecord[]> {
  return fetchList("Lov:Lov:Lov:LoadLovFieldMetodosPagoSat33");
}

/** Devuelve el catálogo completo de regímenes fiscales del SAT. */
export function loadRegimenFiscal(): Promise<RegimenFiscalRecord[]> {
  return fetchList("sistema:empresas:empresas:SearchRegimenesSAT");
}

/**
 * Devuelve las monedas habilitadas para la empresa del JWT.
 * Incluye `tipo_cambio` y `decimales_sat` por moneda.
 */
export function loadMoneda(): Promise<MonedaRecord[]> {
  return fetchList("Lov:Lov:Lov:LoadLovFieldMonedasEmpresa");
}

export function loadUnidadMedida(): Promise<UnidadMedidaRecord[]> {
  return fetchList("Lov:Lov:Lov:LoadLovFieldUnidades");
}
