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

/**
 * Catálogo c_RegimenFiscal del SAT, estático.
 *
 * `loadRegimenFiscal()` (SearchRegimenesSAT) exige sesión — no está en la
 * whitelist sin-JWT de `interfase_jwt.php` —, así que el registro público
 * (`/registro`, §14) no puede consumirlo. Este arreglo es el mismo catálogo
 * publicado por el SAT, con el shape de `RegimenFiscalRecord` para que el
 * picker de `/registro` y el de Perfil sean intercambiables.
 */
export const REGIMEN_FISCAL_SAT_RECORDS: RegimenFiscalRecord[] = [
  { regimen_fiscal_id: "601", regimen: "General de Ley Personas Morales" },
  { regimen_fiscal_id: "603", regimen: "Personas Morales con Fines no Lucrativos" },
  { regimen_fiscal_id: "605", regimen: "Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { regimen_fiscal_id: "606", regimen: "Arrendamiento" },
  { regimen_fiscal_id: "607", regimen: "Régimen de Enajenación o Adquisición de Bienes" },
  { regimen_fiscal_id: "608", regimen: "Demás ingresos" },
  { regimen_fiscal_id: "610", regimen: "Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { regimen_fiscal_id: "611", regimen: "Ingresos por Dividendos (socios y accionistas)" },
  { regimen_fiscal_id: "612", regimen: "Personas Físicas con Actividades Empresariales y Profesionales" },
  { regimen_fiscal_id: "614", regimen: "Ingresos por intereses" },
  { regimen_fiscal_id: "615", regimen: "Régimen de los ingresos por obtención de premios" },
  { regimen_fiscal_id: "616", regimen: "Sin obligaciones fiscales" },
  { regimen_fiscal_id: "620", regimen: "Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { regimen_fiscal_id: "621", regimen: "Incorporación Fiscal" },
  { regimen_fiscal_id: "622", regimen: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { regimen_fiscal_id: "623", regimen: "Opcional para Grupos de Sociedades" },
  { regimen_fiscal_id: "624", regimen: "Coordinados" },
  { regimen_fiscal_id: "625", regimen: "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { regimen_fiscal_id: "626", regimen: "Régimen Simplificado de Confianza" },
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
