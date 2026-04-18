import { apiCall } from "@/api/client";

const MODULE = "ventas:facturas_venta_33:facturas_venta";
const MODULE_CONCEPTOS = "ventas:facturas_venta_33:facturas_venta_conceptos";
const MODULE_LOV = "Lov:Lov:Lov";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ImpuestoConcepto {
  impuesto: string;       // "IVA" | "ISR" | "IEPS"
  aplicacion: string;     // "T" traslado | "R" retención
  tasa: string;
  importe: string;        // calculado por el frontend; llega "0" del catálogo
}

export interface Concepto {
  sku: string;
  clave_prod_ser_sat: string;
  cantidad: string;
  no_identificacion: string;
  descripcion: string;
  cuenta_predial_numero: string | null;
  lista_precios_id: string | null;
  precio_lista: string;
  precio_unitario: string;
  descuento: string;
  deducible_integrado: string;
  factor_descuento: string;
  tipo_descuento: string;   // "F" fijo | "P" porcentaje
  importe: string;
  importe_precio_lista: string;
  observaciones: string | null;
  unidad_id: string;
  usa_lotes: string;        // "S" | "N"
  usa_series: string;       // "S" | "N"
  es_paquete: string;       // "S" | "N"
  almacenable: string;      // "S" | "N"
  item: string;
  objeto_impuesto_sat: string; // "02"
  impuestos_traslados: ImpuestoConcepto[];
  impuestos_retenciones: ImpuestoConcepto[];
  info_aduanera: [];
}

export interface ImpuestoLocal {
  impuesto: string;    // "ISR"
  importe: string;
  tasa: string;
  aplicacion: string;  // "R" | "T"
}

// ---------------------------------------------------------------------------
// FacturaRow — resultado de Search
// ---------------------------------------------------------------------------

export interface FacturaRow {
  start: string;
  empresa_id: string;
  sucursal_id: string;
  fecha: string;                     // "DD/MM/YYYY"
  serie: string;
  folio: string;
  receptor_rfc: string;
  receptor_nombre: string;
  moneda_id: string;
  tipo_cambio: string;
  fecha_vencimiento: string;
  sub_total_conceptos: string;
  descuento: string;
  sub_total: string;
  total_impuestos_retenidos: string;
  total_impuestos_trasladados: string;
  total: string;
  estatus: string;                   // "P" | "R" | "C"
  cancelacion_estatus: string | null;
  estatus_sat: string | null;
  fecha_timbrado: string | null;
  uuid: string | null;
  deducible_importe: string | null;
  pedidos_venta: string;
  num_poliza: string | null;
  saldo: string;
  num_cta_cobrar: string;
  estatus_cxc: string;
}

// ---------------------------------------------------------------------------
// FacturaCompleta — resultado de Load / Add / AddPrefactura / Stamp
// ---------------------------------------------------------------------------

export interface FacturaCompleta {
  empresa_id: string;
  version: string;                   // "4.0"
  serie: string;
  folio: string;
  uso_id: string;
  uso_descr: string;
  confirmacion_pac: string | null;
  uuid: string | null;
  sucursal_id: string;
  cliente_id: string;
  fecha: string;                     // "DD/MM/YYYY HH:mm:ss"
  forma_pago: string;
  forma_pago_descr: string;
  condiciones_de_pago: string | null;
  sub_total_conceptos: string;
  descuento: string;
  sub_total: string;
  total_impuestos_retenidos: string;
  total_impuestos_trasladados: string;
  sub_total_imp_locales: string;
  total_imp_local_retenciones: string;
  total_imp_local_traslados: string;
  total: string;
  motivo_descuento: string | null;
  tipo_cambio: string;
  moneda_id: string;
  metodo_de_pago: string;
  metodo_pago: string;               // "PUE" | "PPD"
  metodo_pago_descr: string;
  num_reg_id_trib: string | null;
  num_cta_pago: string | null;
  emisor_rfc: string;
  emisor_nombre: string;
  receptor_rfc: string;
  receptor_nombre: string;
  fecha_vencimiento: string;
  observaciones: string | null;
  notas_impresion: string | null;
  estatus: string;                   // "P" | "R" | "C"
  actualizacion_usuario_id: string;
  actualizacion_fecha: string;       // "DD/MM/YYYY HH:mm"
  calle: string;
  no_exterior: string;
  no_interior: string | null;
  colonia: string;
  localidad: string;
  referencia: string | null;
  municipio: string;
  estado: string;
  pais: string;
  codigo_postal: string;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  centro_utilidad_id: string | null;
  centro_costo_id: string | null;
  regimen_fiscal_id: string;
  receptor_regimen_fiscal_id: string;
  cancelacion_estatus: string | null;
  estatus_sat: string | null;
  // Sólo en respuestas de mutación:
  orden_compra_cliente?: string | null;
  cancelacion_motivo?: string | null;
  cancelacion_motivo_descr?: string | null;
  cancelacion_cfdi_reemplaza?: string | null;
  cancelacion_acuse?: string | null;
  info_seguros: [];
  compl_serv_parc_construc: [];
  impuestos_locales: ImpuestoLocal[];
  conceptos: Concepto[];
  pedidos: { totalCount: number; records: [] };
  salidas: { totalCount: number; records: [] };
  reportes_consigna: { totalCount: number; records: [] };
  documentos: [];
  comercio_exterior: { mercancias: [] };
}

// ---------------------------------------------------------------------------
// SatEstatus — campo adicional en LoadEstatusSAT
// ---------------------------------------------------------------------------

export interface SatEstatus {
  CodigoEstatus: string;
  EsCancelable: string;
  Estado: string;          // "Vigente" | "Cancelado"
  EstatusCancelacion: string;
  ValidacionEFOS: string;
  statusSat: string;
  isCancelable: string;
  statusCancelation: string;
}

// ---------------------------------------------------------------------------
// LOV de SKUs para facturación
// ---------------------------------------------------------------------------

export interface ImpuestoConceptoLov {
  esquema_impuestos_id: string;
  impuesto: string;        // "IVA"
  aplicacion: string;      // "T" | "R"
  tasa: string;            // "16.0000"
  tipo_factor: string;
  num_impuesto: string;
  importe: string;         // siempre "0" — la UI calcula
}

export interface SkuLov {
  sku: string;
  descripcion: string;
  clave_prod_ser_sat: string;
  marca: string | null;
  modelo: string | null;
  submodelo: string | null;
  unidad_id: string;
  fraccion_arancelaria: string | null;
  clave_unidad_sat: string;
  unidad_aduana: string | null;
  precio: string;
  lista_precios_id: string | null;
  esquema_impuestos_id: string;
  usa_series: string;      // "S" | "N"
  usa_lotes: string;       // "S" | "N"
  almacenable: string;     // "S" | "N"
  precios: [string, string, string, string][];  // [lista_id, precio, moneda, tipo_cambio]
  moneda_id: string;
  tipo_cambio: string;
  impuestos_traslados: ImpuestoConceptoLov[];
  // Solo en ValidateSku:
  estatus?: string;
  impuestos_retenciones?: ImpuestoConceptoLov[];
}

// ---------------------------------------------------------------------------
// LOV de Clientes
// ---------------------------------------------------------------------------

export interface ClienteLov {
  empresa_id: string;
  cliente_id: string;
  corporativo_id: string;
  rfc: string;
  nombre: string;
  calle: string | null;
  no_interior: string | null;
  no_exterior: string | null;
  colonia: string | null;
  localidad: string | null;
  referencia: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string;
  codigo_postal: string | null;
  metodo_de_pago: string | null;
  metodo_de_pago_descr: string | null;
  lista_precios_id: string;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  num_cta_pago: string | null;
  dias_credito: string;
  limite_credito: string;
  fecha_vencimiento: string;
  estatus: string;          // "A" | "I"
  regimen_fiscal_id: string;
}

// ---------------------------------------------------------------------------
// Search params
// ---------------------------------------------------------------------------

export interface FacturaSearchParams {
  fecha_inicial?: string;
  fecha_final?: string;
  rfc?: string;
  nombre?: string;
  serie?: string;
  folio?: string;
  pedido_serie?: string;
  pedido_folio?: string;
  estatus?: string;
  disable_sucursal_filter?: string;
  start?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Payload de Add / AddPrefactura / UpdatePrefactura / Stamp
// ---------------------------------------------------------------------------

export interface FacturaPayload {
  serie: string;
  folio: string;
  estatus_sat: string;
  notas_impresion: string;
  observaciones: string;
  estatus: string;
  fecha: string;
  cliente_id: string;
  receptor_nombre: string;
  receptor_rfc: string;
  receptor_regimen_fiscal_id: string;
  lista_precios_id: string;
  calle: string;
  no_exterior: string;
  no_interior: string;
  colonia: string;
  municipio: string;
  codigo_postal: string;
  localidad: string;
  estado: string;
  pais: string;
  vendedor_id: string;
  vendedor_nombre: string;
  centro_costo_id: string;
  centro_utilidad_id: string;
  condiciones_de_pago: string;
  confirmacion_sat: string;
  uso_id: string;
  uso_descr: string;
  metodo_pago: string;       // "PUE" | "PPD"
  metodo_pago_descr: string;
  moneda_id: string;
  tipo_cambio: string;
  decimales_sat: string;
  forma_pago: string;
  forma_pago_descr: string;
  fecha_vencimiento: string;
  a_credito: string;
  NumRegIdTrib: string;
  orden_compra_cliente: string;
  // PUE integrado (opcional)
  cuenta_cobro_id?: string;
  referencia_pago?: string;
  // PUE — pago integrado, solo en Add
  "generar_ingreso[importe]"?: string;
  "generar_ingreso[referencia_pago]"?: string;
  "generar_ingreso[banco_id]"?: string;
  "generar_ingreso[banco_descr]"?: string;
  "generar_ingreso[sat_cta_ori]"?: string;
  "generar_ingreso[sat_cta_dest]"?: string;
  "generar_ingreso[sat_banco_dest]"?: string;
  "generar_ingreso[sat_banco_dest_descr]"?: string;
  // Conceptos
  conceptos: ConceptoPayload[];
  // Complementos (siempre presentes, vacíos en Fase 4)
  compl_serv_par_construc: ComplServParConstruc;
  info_seguros: InfoSeguros;
  comercio_exterior: ComercioExterior;
  detallista: Detallista;
}

export interface ConceptoPayload {
  sku: string;
  clave_prod_ser_sat: string;
  cantidad: string;
  no_identificacion: string;
  cuenta_predial_numero: string;
  precio_unitario: string;
  precio_lista: string;
  descuento: string;
  tipo_descuento: string;
  factor_descuento: string;
  importe_precio_lista: string;
  importe: string;
  importe_ieps: string;
  observaciones: string;
  unidad_id: string;
  usa_lotes: string;
  usa_series: string;
  es_paquete: string;
  almacenable: string;
  costo: string;
  impuestos_traslados: ImpuestoConcepto[];
  impuestos_retenciones?: ImpuestoConcepto[];
  pedido_serie: string;
  pedido_folio: string;
  pedido_item: string;
  precios: [string, string, string, string][];
  lista_precios_id: string;
  es_consigna: string;
  objeto_impuesto_sat: string;
  deducible_integrado: string;
  fraccion_arancelaria: string;
  marca: string;
  modelo: string;
  submodelo: string;
  descripcion: string;
  unidad_aduana: string;
  moneda_id: string;
  tipo_cambio: string;
}

export interface ComplServParConstruc {
  num_per_lico_aut: string;
  calle: string;
  no_exterior: string;
  no_interior: string;
  colonia: string;
  localidad: string;
  referencia: string;
  municipio: string;
  estado: string;
  codigo_postal: string;
  leyenda_impresa: string;
}

export interface InfoSeguros {
  aseguradora_id: string;
  aseguradora_nombre: string;
  orden_servicio: string;
  asegurado_nombre: string;
  poliza: string;
  vehiculo_serie: string;
  no_siniestro: string;
  vehiculo_modelo: string;
  vehiculo_tarjeta_circulacion: string;
  asegurado_id_oficial: string;
  vehiculo_tipo: string;
  autorizo_nombre: string;
  inciso: string;
  num_reporte: string;
  num_folio: string;
  num_cotizacion: string;
  vehiculo_marca: string;
  vehiculo_submarca: string;
  vehiculo_color: string;
  vehiculo_placa: string;
  tipo_servicio: string;
  deducible_porcentaje: string;
  deducible_importe: string;
  integra_deducible: string;
  descuento_aseguradora_porcent: string;
  descuento_aseguradora_importe: string;
  fecha_instalacion: string;
  fecha_digitaliza_expediente: string;
}

export interface ComercioExterior {
  tipo_operacion: string;
  clave_de_pedimento: string;
  num_certificado_origen: string;
  incoterm: string;
  certificado_origen: string;
  numero_exportador_confiable: string;
  subdivision: string;
  tipo_cambio_usd: string;
  total_usd: string;
  observaciones: string;
}

export interface Detallista {
  document_status: string;
  requestForPaymentIdentification: string;
  buyer: { gln: string; personOrDepartmentName: string };
  seller: { gln: string; type: string; seller_alt_party_identification: string };
  delivery_note_reference_date: string;
  order_identification_reference_date: string;
  special_instruction_code: string;
}

// ---------------------------------------------------------------------------
// Valores vacíos para los complementos opcionales (Fase 4)
// ---------------------------------------------------------------------------

export const EMPTY_COMPL_SERV_PAR_CONSTRUC: ComplServParConstruc = {
  num_per_lico_aut: "", calle: "", no_exterior: "", no_interior: "",
  colonia: "", localidad: "", referencia: "", municipio: "",
  estado: "", codigo_postal: "", leyenda_impresa: "",
};

export const EMPTY_INFO_SEGUROS: InfoSeguros = {
  aseguradora_id: "", aseguradora_nombre: "", orden_servicio: "",
  asegurado_nombre: "", poliza: "", vehiculo_serie: "", no_siniestro: "",
  vehiculo_modelo: "", vehiculo_tarjeta_circulacion: "", asegurado_id_oficial: "",
  vehiculo_tipo: "", autorizo_nombre: "", inciso: "", num_reporte: "",
  num_folio: "", num_cotizacion: "", vehiculo_marca: "", vehiculo_submarca: "",
  vehiculo_color: "", vehiculo_placa: "", tipo_servicio: "",
  deducible_porcentaje: "0", deducible_importe: "0", integra_deducible: "N",
  descuento_aseguradora_porcent: "", descuento_aseguradora_importe: "",
  fecha_instalacion: "", fecha_digitaliza_expediente: "",
};

export const EMPTY_COMERCIO_EXTERIOR: ComercioExterior = {
  tipo_operacion: "2", clave_de_pedimento: "A1",
  num_certificado_origen: "", incoterm: "", certificado_origen: "",
  numero_exportador_confiable: "", subdivision: "0",
  tipo_cambio_usd: "", total_usd: "", observaciones: "",
};

export const EMPTY_DETALLISTA: Detallista = {
  document_status: "", requestForPaymentIdentification: "",
  buyer: { gln: "", personOrDepartmentName: "" },
  seller: { gln: "", type: "", seller_alt_party_identification: "" },
  delivery_note_reference_date: "", order_identification_reference_date: "",
  special_instruction_code: "",
};

// ---------------------------------------------------------------------------
// Facturas — endpoints
// ---------------------------------------------------------------------------

export function searchFacturas(params: FacturaSearchParams) {
  return apiCall<{ totalCount: number; records: FacturaRow[] }>(
    `${MODULE}:Search`,
    params as Record<string, string | number | boolean>
  );
}

export function loadFactura(serie: string, folio: string) {
  return apiCall<FacturaCompleta>(`${MODULE}:Load`, { serie, folio });
}

export function loadPresetClientData(clienteId: string) {
  return apiCall<FacturaCompleta>(`${MODULE}:LoadPresetClientData`, {
    cliente_id: clienteId,
  });
}

export function addPrefactura(payload: FacturaPayload) {
  return apiCall<{ msg: string; log: string; record: FacturaCompleta }>(
    `${MODULE}:AddPrefactura`,
    payload as unknown as Record<string, string | number | boolean>
  );
}

export function updatePrefactura(payload: FacturaPayload) {
  return apiCall<{ msg: string; log: string; record: FacturaCompleta }>(
    `${MODULE}:UpdatePrefactura`,
    payload as unknown as Record<string, string | number | boolean>
  );
}

export function addFactura(payload: FacturaPayload) {
  return apiCall<{ msg: string; log: string; record: FacturaCompleta }>(
    `${MODULE}:Add`,
    payload as unknown as Record<string, string | number | boolean>
  );
}

export function stampFactura(payload: FacturaPayload) {
  return apiCall<{ msg: string; log: string; record: FacturaCompleta }>(
    `${MODULE}:Stamp`,
    payload as unknown as Record<string, string | number | boolean>
  );
}

export function cancelFactura(
  serie: string,
  folio: string,
  motivo: string,
  folioSustitucion: string
) {
  return apiCall<{ msg: string; log: string; record: FacturaCompleta }>(
    `${MODULE}:Cancel33`,
    { serie, folio, motivo, folio_sustitucion: folioSustitucion }
  );
}

export function loadEstatusSAT(serie: string, folio: string) {
  return apiCall<FacturaCompleta & { sat_estatus: SatEstatus }>(
    `${MODULE}:LoadEstatusSAT`,
    { serie, folio }
  );
}

export function sendMailFactura(
  serie: string,
  folio: string,
  nombre: string,
  correo: string,
  asunto: string
) {
  return apiCall<{ msg: string; log: string }>(
    `${MODULE}:SendMail`,
    { serie, folio, nombre, correo, asunto }
  );
}

/**
 * PrintPdf usa GET con params en query string — patrón diferente al estándar.
 * Devuelve el Blob binario del PDF para que el cliente cree un Object URL.
 */
export async function printPdfFactura(
  empresaId: string,
  serie: string,
  folio: string,
  printMetodoPago: string
): Promise<Blob> {
  const session = localStorage.getItem("sv3_session") ?? "";
  const base = import.meta.env.VITE_API_BASE_URL as string;
  const params = new URLSearchParams({
    opReq: `${MODULE}:PrintPdf`,
    session,
    empresa_id: empresaId,
    serie,
    folio,
    printMetodoPago,
  });
  const response = await fetch(`${base}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.blob();
}

// ---------------------------------------------------------------------------
// Conceptos — búsqueda/validación en facturación
// ---------------------------------------------------------------------------

export function loadLovFieldSku(
  start: number,
  limit: number,
  listaPreciosId: string
) {
  return apiCall<{ totalCount: number; records: SkuLov[] }>(
    `${MODULE_CONCEPTOS}:LoadLovFieldSku`,
    { start, limit, lista_precios_id: listaPreciosId, pageSize: limit }
  );
}

export function validateSku(sku: string, listaPreciosId: string) {
  return apiCall<SkuLov>(`${MODULE_CONCEPTOS}:ValidateSku`, {
    sku,
    lista_precios_id: listaPreciosId,
  });
}

// ---------------------------------------------------------------------------
// LOV Clientes
// ---------------------------------------------------------------------------

export function loadLovFieldClientes(pageSize = 50) {
  return apiCall<{ totalCount: number; records: ClienteLov[] }>(
    `${MODULE_LOV}:LoadLovFieldClientes`,
    { pageSize }
  );
}

export function validateLovFieldClientes(clienteId: string) {
  return apiCall<ClienteLov>(`${MODULE_LOV}:ValidateLovFieldClientes`, {
    cliente_id: clienteId,
  });
}

/** Búsqueda de clientes por nombre o RFC para el autocomplete de facturación */
export function searchClientesForFactura(query: string) {
  return apiCall<{ totalCount: number; records: Array<{ cliente_id: string; nombre: string; rfc: string }> }>(
    "ventas:clientes:clientes:Search",
    { nombre: query, estatus: "A", tipo_cliente_deudor: "CLIENTE", limit: 20, start: 0 }
  );
}

/** Busca SKUs con descripción opcional para el autocomplete de conceptos */
export function searchSkuForFactura(query: string, listaPreciosId: string, limit = 20) {
  return apiCall<{ totalCount: number; records: SkuLov[] }>(
    `${MODULE_CONCEPTOS}:LoadLovFieldSku`,
    { start: 0, limit, lista_precios_id: listaPreciosId, pageSize: limit, descripcion: query }
  );
}
