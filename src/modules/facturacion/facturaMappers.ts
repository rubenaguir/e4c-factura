import type { FacturaPayload, ConceptoPayload, SkuLov, FacturaCompleta, Concepto } from "@/api/endpoints/facturas";
import {
  EMPTY_COMPL_SERV_PAR_CONSTRUC, EMPTY_INFO_SEGUROS,
  EMPTY_COMERCIO_EXTERIOR, EMPTY_DETALLISTA,
} from "@/api/endpoints/facturas";
import type { DraftConcepto, FacturaDraft } from "./types";
import { newKey, calcBase, calcImpImporte, todayISO, isoToApiDate, apiDateToISO } from "./facturaUtils";

// ─── Constructores de draft ───────────────────────────────────────────────────

export function newDraft(): FacturaDraft {
  return {
    serie: "", folio: "", uuid: null, estatus: "", estatus_sat: "",
    clienteId: "", receptorNombre: "", receptorRfc: "", receptorRegimenFiscalId: "",
    usoCfdiId: "G03", usoCfdiDescr: "Gastos en general",
    calle: "", noExterior: "", noInterior: "", colonia: "",
    municipio: "", codigoPostal: "", localidad: "", estado: "", pais: "MEX",
    fecha: todayISO(),
    metodoPago: "PPD", metodoPagoDescr: "Pago en parcialidades o diferido",
    formaPago: "99", formaPagoDescr: "Por definir",
    monedaId: "MXN", tipoCambio: "1", decimalesSat: "2",
    fechaVencimiento: todayISO(), aCredito: "N",
    condicionesDePago: "", confirmacionSat: "",
    vendedorId: "", vendedorNombre: "",
    centroCostoId: "", centroUtilidadId: "",
    observaciones: "", notasImpresion: "", ordenCompraCliente: "",
    listaPreciosId: "", numRegIdTrib: "",
    cuentaCobroId: "", referenciaPago: "",
    conceptos: [],
  };
}

export function draftFromFactura(f: FacturaCompleta): FacturaDraft {
  return {
    serie: f.serie, folio: f.folio, uuid: f.uuid ?? "", estatus: f.estatus, estatus_sat: f.estatus_sat ?? "",
    clienteId: f.cliente_id,
    receptorNombre: f.receptor_nombre, receptorRfc: f.receptor_rfc,
    receptorRegimenFiscalId: f.receptor_regimen_fiscal_id,
    usoCfdiId: f.uso_id, usoCfdiDescr: f.uso_descr,
    calle: f.calle, noExterior: f.no_exterior, noInterior: f.no_interior ?? "",
    colonia: f.colonia, municipio: f.municipio, codigoPostal: f.codigo_postal,
    localidad: f.localidad, estado: f.estado, pais: f.pais,
    fecha: apiDateToISO(f.fecha),
    metodoPago: f.metodo_pago, metodoPagoDescr: f.metodo_pago_descr,
    formaPago: f.forma_pago, formaPagoDescr: f.forma_pago_descr,
    monedaId: f.moneda_id, tipoCambio: f.tipo_cambio, decimalesSat: "2",
    fechaVencimiento: apiDateToISO(f.fecha_vencimiento), aCredito: "N",
    condicionesDePago: f.condiciones_de_pago ?? "", confirmacionSat: "",
    vendedorId: f.vendedor_id ?? "", vendedorNombre: f.vendedor_nombre ?? "",
    centroCostoId: f.centro_costo_id ?? "", centroUtilidadId: f.centro_utilidad_id ?? "",
    observaciones: f.observaciones ?? "", notasImpresion: f.notas_impresion ?? "",
    ordenCompraCliente: "", listaPreciosId: f.conceptos[0]?.lista_precios_id ?? "",
    numRegIdTrib: f.num_reg_id_trib ?? "",
    cuentaCobroId: f.num_cta_pago ?? "", referenciaPago: "",
    conceptos: f.conceptos.map(conceptoFromExisting),
  };
}

export function conceptoFromExisting(c: Concepto): DraftConcepto {
  return {
    _key: newKey(), sku: c.sku, descripcion: c.descripcion,
    clave_prod_ser_sat: c.clave_prod_ser_sat,
    cantidad: c.cantidad, precio_unitario: c.precio_unitario,
    descuento: c.descuento, tipo_descuento: c.tipo_descuento,
    factor_descuento: c.factor_descuento,
    unidad_id: c.unidad_id, lista_precios_id: c.lista_precios_id ?? "",
    precios: [], objeto_impuesto_sat: c.objeto_impuesto_sat,
    almacenable: c.almacenable, usa_lotes: c.usa_lotes, usa_series: c.usa_series,
    es_paquete: c.es_paquete, observaciones: c.observaciones ?? "",
    marca: "", modelo: "", submodelo: "", fraccion_arancelaria: "",
    unidad_aduana: "", es_consigna: "", costo: "0",
    no_identificacion: c.no_identificacion, cuenta_predial_numero: c.cuenta_predial_numero ?? "",
    impuestos_traslados: c.impuestos_traslados.map(i => ({
      _key: newKey(), aplicacion: "T", impuesto: i.impuesto,
      tipo_factor: "Tasa", tasa: i.tasa, esquema_impuestos_id: "", num_impuesto: "1",
    })),
    impuestos_retenciones: c.impuestos_retenciones.map(i => ({
      _key: newKey(), aplicacion: "R", impuesto: i.impuesto,
      tipo_factor: "Tasa", tasa: i.tasa, esquema_impuestos_id: "", num_impuesto: "1",
    })),
    moneda_id: "MXN", tipo_cambio: "1",
  };
}

export function conceptoFromSku(sku: SkuLov, monedaId: string, tipoCambio: string): DraftConcepto {
  return {
    _key: newKey(), sku: sku.sku, descripcion: sku.descripcion,
    clave_prod_ser_sat: sku.clave_prod_ser_sat,
    cantidad: "1", precio_unitario: sku.precio,
    descuento: "0", tipo_descuento: "F", factor_descuento: "0",
    unidad_id: sku.unidad_id, lista_precios_id: sku.lista_precios_id ?? "",
    precios: sku.precios ?? [], objeto_impuesto_sat: "02",
    almacenable: sku.almacenable, usa_lotes: sku.usa_lotes, usa_series: sku.usa_series,
    es_paquete: "N", observaciones: "",
    marca: sku.marca ?? "", modelo: sku.modelo ?? "", submodelo: sku.submodelo ?? "",
    fraccion_arancelaria: sku.fraccion_arancelaria ?? "",
    unidad_aduana: sku.unidad_aduana ?? "", es_consigna: "", costo: "0",
    no_identificacion: "", cuenta_predial_numero: "",
    impuestos_traslados: sku.impuestos_traslados
      .filter(i => i.aplicacion === "T")
      .map(i => ({
        _key: newKey(), aplicacion: "T", impuesto: i.impuesto,
        tipo_factor: i.tipo_factor || "Tasa", tasa: i.tasa,
        esquema_impuestos_id: i.esquema_impuestos_id, num_impuesto: i.num_impuesto,
      })),
    impuestos_retenciones: (sku.impuestos_retenciones ?? [])
      .filter(i => i.aplicacion === "R")
      .map(i => ({
        _key: newKey(), aplicacion: "R", impuesto: i.impuesto,
        tipo_factor: i.tipo_factor || "Tasa", tasa: i.tasa,
        esquema_impuestos_id: i.esquema_impuestos_id, num_impuesto: i.num_impuesto,
      })),
    moneda_id: sku.moneda_id || monedaId,
    tipo_cambio: sku.tipo_cambio || tipoCambio,
  };
}

// ─── Constructores de payload (draft → API) ───────────────────────────────────

export function buildConceptoPayload(c: DraftConcepto): ConceptoPayload {
  const base = calcBase(c);
  return {
    sku: c.sku,
    clave_prod_ser_sat: c.clave_prod_ser_sat,
    cantidad: c.cantidad,
    no_identificacion: c.no_identificacion || c.sku,
    cuenta_predial_numero: c.cuenta_predial_numero,
    precio_unitario: c.precio_unitario,
    precio_lista: c.precio_unitario,
    descuento: c.descuento,
    tipo_descuento: c.tipo_descuento,
    factor_descuento: c.factor_descuento,
    importe_precio_lista: String(base),
    importe: String(base),
    importe_ieps: "0",
    observaciones: c.observaciones,
    unidad_id: c.unidad_id,
    usa_lotes: c.usa_lotes,
    usa_series: c.usa_series,
    es_paquete: c.es_paquete,
    almacenable: c.almacenable,
    costo: c.costo || "0",
    impuestos_traslados: c.impuestos_traslados.map(imp => ({
      esquema_impuestos_id: imp.esquema_impuestos_id,
      impuesto: imp.impuesto,
      aplicacion: "T",
      tasa: imp.tasa,
      tipo_factor: imp.tipo_factor,
      num_impuesto: imp.num_impuesto,
      importe: String(calcImpImporte(base, imp.tasa, imp.tipo_factor)),
    })),
    impuestos_retenciones: c.impuestos_retenciones.map(imp => ({
      esquema_impuestos_id: imp.esquema_impuestos_id,
      impuesto: imp.impuesto,
      aplicacion: "R",
      tasa: imp.tasa,
      tipo_factor: imp.tipo_factor,
      num_impuesto: imp.num_impuesto,
      importe: String(calcImpImporte(base, imp.tasa, imp.tipo_factor)),
    })),
    pedido_serie: "",
    pedido_folio: "",
    pedido_item: "",
    precios: c.precios,
    lista_precios_id: c.lista_precios_id,
    es_consigna: c.es_consigna,
    objeto_impuesto_sat: c.objeto_impuesto_sat,
    deducible_integrado: "0",
    fraccion_arancelaria: c.fraccion_arancelaria,
    marca: c.marca,
    modelo: c.modelo,
    submodelo: c.submodelo,
    descripcion: c.descripcion,
    unidad_aduana: c.unidad_aduana,
    moneda_id: c.moneda_id,
    tipo_cambio: c.tipo_cambio,
  };
}

export function buildPayload(draft: FacturaDraft): FacturaPayload {
  return {
    serie: draft.serie,
    folio: draft.folio,
    estatus_sat: draft.estatus_sat,
    notas_impresion: draft.notasImpresion,
    observaciones: draft.observaciones,
    estatus: draft.estatus,
    fecha: isoToApiDate(draft.fecha),
    cliente_id: draft.clienteId,
    receptor_nombre: draft.receptorNombre,
    receptor_rfc: draft.receptorRfc,
    receptor_regimen_fiscal_id: draft.receptorRegimenFiscalId,
    lista_precios_id: draft.listaPreciosId,
    calle: draft.calle,
    no_exterior: draft.noExterior,
    no_interior: draft.noInterior,
    colonia: draft.colonia,
    municipio: draft.municipio,
    codigo_postal: draft.codigoPostal,
    localidad: draft.localidad,
    estado: draft.estado,
    pais: draft.pais,
    vendedor_id: draft.vendedorId,
    vendedor_nombre: draft.vendedorNombre,
    centro_costo_id: draft.centroCostoId,
    centro_utilidad_id: draft.centroUtilidadId,
    condiciones_de_pago: draft.condicionesDePago,
    confirmacion_sat: draft.confirmacionSat,
    uso_id: draft.usoCfdiId,
    uso_descr: draft.usoCfdiDescr,
    metodo_pago: draft.metodoPago,
    metodo_pago_descr: draft.metodoPagoDescr,
    moneda_id: draft.monedaId,
    tipo_cambio: draft.tipoCambio,
    decimales_sat: draft.decimalesSat,
    forma_pago: draft.formaPago,
    forma_pago_descr: draft.formaPagoDescr,
    fecha_vencimiento: isoToApiDate(draft.fechaVencimiento),
    a_credito: draft.aCredito,
    NumRegIdTrib: draft.numRegIdTrib,
    orden_compra_cliente: draft.ordenCompraCliente,
    ...(draft.metodoPago === "PUE" && draft.cuentaCobroId
      ? { cuenta_cobro_id: draft.cuentaCobroId, referencia_pago: draft.referenciaPago }
      : {}),
    conceptos: draft.conceptos.map(buildConceptoPayload),
    compl_serv_par_construc: EMPTY_COMPL_SERV_PAR_CONSTRUC,
    info_seguros: EMPTY_INFO_SEGUROS,
    comercio_exterior: EMPTY_COMERCIO_EXTERIOR,
    detallista: EMPTY_DETALLISTA,
  };
}
