// ─── Draft types ─────────────────────────────────────────────────────────────
// Representan el estado local (UI) de una factura en edición.
// Son independientes de los tipos de la API (FacturaPayload, FacturaCompleta).

export interface DraftImpuesto {
  _key: string;
  aplicacion: string;          // "T" | "R"
  impuesto: string;            // "IVA" | "ISR" | "IEPS"
  tipo_factor: string;         // "Tasa" | "Cuota" | "Exento"
  tasa: string;                // porcentaje, e.g. "16.0000"
  esquema_impuestos_id: string;
  num_impuesto: string;
}

export interface DraftConcepto {
  _key: string;
  sku: string;
  descripcion: string;
  clave_prod_ser_sat: string;
  cantidad: string;
  precio_unitario: string;
  descuento: string;
  tipo_descuento: string;
  factor_descuento: string;
  unidad_id: string;
  lista_precios_id: string;
  precios: [string, string, string, string][];
  objeto_impuesto_sat: string;
  almacenable: string;
  usa_lotes: string;
  usa_series: string;
  es_paquete: string;
  observaciones: string;
  marca: string;
  modelo: string;
  submodelo: string;
  fraccion_arancelaria: string;
  unidad_aduana: string;
  es_consigna: string;
  costo: string;
  no_identificacion: string;
  cuenta_predial_numero: string;
  impuestos_traslados: DraftImpuesto[];
  impuestos_retenciones: DraftImpuesto[];
  moneda_id: string;
  tipo_cambio: string;
}

export interface FacturaDraft {
  serie: string;
  folio: string;
  uuid: string | null;
  estatus: string;
  estatus_sat: string;
  clienteId: string;
  receptorNombre: string;
  receptorRfc: string;
  receptorRegimenFiscalId: string;
  usoCfdiId: string;
  usoCfdiDescr: string;
  calle: string;
  noExterior: string;
  noInterior: string;
  colonia: string;
  municipio: string;
  codigoPostal: string;
  localidad: string;
  estado: string;
  pais: string;
  fecha: string;            // YYYY-MM-DD
  metodoPago: string;       // "PUE" | "PPD"
  metodoPagoDescr: string;
  formaPago: string;
  formaPagoDescr: string;
  monedaId: string;
  tipoCambio: string;
  decimalesSat: string;
  fechaVencimiento: string; // YYYY-MM-DD
  aCredito: string;
  condicionesDePago: string;
  confirmacionSat: string;
  vendedorId: string;
  vendedorNombre: string;
  centroCostoId: string;
  centroUtilidadId: string;
  observaciones: string;
  notasImpresion: string;
  ordenCompraCliente: string;
  listaPreciosId: string;
  numRegIdTrib: string;
  cuentaCobroId: string;
  referenciaPago: string;
  importePago: string;
  bancoId: string;
  bancoDescr: string;
  satCtaOri: string;
  satCtaDest: string;
  satBancoDest: string;
  satBancoDestDescr: string;
  conceptos: DraftConcepto[];
}

export interface TotalRow {
  aplicacion: string;
  impuesto: string;
  tasa: string;
  importe: number;
}

export interface Totales {
  subtotal: number;
  rows: TotalRow[];
  total: number;
}
