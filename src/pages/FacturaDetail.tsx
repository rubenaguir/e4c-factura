import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Loader2, FileText, Mail, MoreHorizontal, Search, X, Check,
} from "lucide-react";
import { useFacturas } from "@/context/FacturasContext";
import { useCatalogos } from "@/context/CatalogosContext";
import { useAuth } from "@/hooks/useAuth";
import {
  validateSku, searchClientesForFactura, searchSkuForFactura,
  validateLovFieldClientes,
  EMPTY_COMPL_SERV_PAR_CONSTRUC, EMPTY_INFO_SEGUROS,
  EMPTY_COMERCIO_EXTERIOR, EMPTY_DETALLISTA,
} from "@/api/endpoints/facturas";
import { addCliente } from "@/api/endpoints/clientes";
import { addProducto } from "@/api/endpoints/productos";
import type { FacturaPayload, ConceptoPayload, SkuLov, ClienteLov, FacturaCompleta, Concepto } from "@/api/endpoints/facturas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

// ─── Local key generator ────────────────────────────────────────────────────
let _kseq = 0;
const newKey = () => String(++_kseq);

// ─── Local draft types ───────────────────────────────────────────────────────

interface DraftImpuesto {
  _key: string;
  aplicacion: string;          // "T" | "R"
  impuesto: string;            // "IVA" | "ISR" | "IEPS"
  tipo_factor: string;         // "Tasa" | "Cuota" | "Exento"
  tasa: string;                // percentage, e.g. "16.0000"
  esquema_impuestos_id: string;
  num_impuesto: string;
}

interface DraftConcepto {
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

interface FacturaDraft {
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
  fecha: string;           // YYYY-MM-DD
  metodoPago: string;      // "PUE" | "PPD"
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
  conceptos: DraftConcepto[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonthISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/** "DD/MM/YYYY[ HH:mm:ss]" → "YYYY-MM-DD" */
function apiDateToISO(s: string): string {
  if (!s) return "";
  const part = s.split(" ")[0];
  const [d, m, y] = part.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → "DD/MM/YYYY" */
function isoToApiDate(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function fmt(n: number): string {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcBase(c: DraftConcepto): number {
  const qty = parseFloat(c.cantidad) || 0;
  const price = parseFloat(c.precio_unitario) || 0;
  const discount = parseFloat(c.descuento) || 0;
  return qty * price - discount;
}

function calcImpImporte(base: number, tasa: string, tipoFactor: string): number {
  if (tipoFactor === "Exento") return 0;
  const t = parseFloat(tasa) || 0;
  return base * (t / 100);
}

interface TotalRow { aplicacion: string; impuesto: string; tasa: string; importe: number }
interface Totales { subtotal: number; rows: TotalRow[]; total: number }

function calcTotales(conceptos: DraftConcepto[]): Totales {
  let subtotal = 0;
  const map = new Map<string, TotalRow>();

  for (const c of conceptos) {
    const base = calcBase(c);
    subtotal += base;
    const allImps = [
      ...c.impuestos_traslados.map(i => ({ ...i, aplicacion: "T" })),
      ...c.impuestos_retenciones.map(i => ({ ...i, aplicacion: "R" })),
    ];
    for (const imp of allImps) {
      const k = `${imp.aplicacion}:${imp.impuesto}:${imp.tasa}`;
      const importe = calcImpImporte(base, imp.tasa, imp.tipo_factor);
      const existing = map.get(k);
      if (existing) existing.importe += importe;
      else map.set(k, { aplicacion: imp.aplicacion, impuesto: imp.impuesto, tasa: imp.tasa, importe });
    }
  }
  const rows = Array.from(map.values());
  const traslados = rows.filter(r => r.aplicacion === "T").reduce((s, r) => s + r.importe, 0);
  const retenciones = rows.filter(r => r.aplicacion === "R").reduce((s, r) => s + r.importe, 0);
  return { subtotal, rows, total: subtotal + traslados - retenciones };
}

function buildConceptoPayload(c: DraftConcepto): ConceptoPayload {
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

function buildPayload(draft: FacturaDraft): FacturaPayload {
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

function newDraft(): FacturaDraft {
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
    fechaVencimiento: nextMonthISO(), aCredito: "N",
    condicionesDePago: "", confirmacionSat: "",
    vendedorId: "", vendedorNombre: "",
    centroCostoId: "", centroUtilidadId: "",
    observaciones: "", notasImpresion: "", ordenCompraCliente: "",
    listaPreciosId: "", numRegIdTrib: "",
    cuentaCobroId: "", referenciaPago: "",
    conceptos: [],
  };
}

function draftFromFactura(f: FacturaCompleta): FacturaDraft {
  return {
    serie: f.serie, folio: f.folio, uuid: f.uuid ?? "", estatus: f.estatus, estatus_sat: f.estatus_sat ?? "",
    clienteId: f.cliente_id,
    receptorNombre: f.receptor_nombre, receptorRfc: f.receptor_rfc,
    receptorRegimenFiscalId: f.regimen_fiscal_id,
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

function conceptoFromExisting(c: Concepto): DraftConcepto {
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

function conceptoFromSku(sku: SkuLov, monedaId: string, tipoCambio: string): DraftConcepto {
  return {
    _key: newKey(), sku: sku.sku, descripcion: sku.descripcion,
    clave_prod_ser_sat: sku.clave_prod_ser_sat,
    cantidad: "1", precio_unitario: sku.precio,
    descuento: "0", tipo_descuento: "F", factor_descuento: "0",
    unidad_id: sku.unidad_id, lista_precios_id: sku.lista_precios_id ?? "",
    precios: sku.precios, objeto_impuesto_sat: "02",
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

// ─── useIsDesktop ────────────────────────────────────────────────────────────

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

// ─── InlineModal — Sheet (mobile) / Dialog (desktop) ────────────────────────

function InlineModal({
  open, onClose, title, children, className,
}: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; className?: string;
}) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className={className ?? "sm:max-w-lg"}>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-lg">
        <SheetHeader className="mb-4"><SheetTitle>{title}</SheetTitle></SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

// ─── ClientePicker ───────────────────────────────────────────────────────────

interface ClientePickerProps {
  clienteId: string;
  receptorNombre: string;
  receptorRfc: string;
  readonly: boolean;
  onSelect: (client: ClienteLov) => void;
  onPresetLoaded: (f: FacturaCompleta) => void;
  regimenFiscalOptions: { value: string; label: string }[];
}

function ClientePicker({
  clienteId, receptorNombre, receptorRfc, readonly,
  onSelect, onPresetLoaded, regimenFiscalOptions,
}: ClientePickerProps) {
  const { loadPresetClientData } = useFacturas();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ cliente_id: string; nombre: string; rfc: string }>>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: "", rfc: "", codigo_postal: "", regimen_fiscal_id: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const debRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDrop(false); return; }
    setSearching(true);
    try {
      const res = await searchClientesForFactura(q);
      setResults(res.records ?? []);
      setShowDrop(true);
    } catch { setResults([]); setShowDrop(true); }
    finally { setSearching(false); }
  }, []);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSelectId = async (id: string) => {
    setShowDrop(false); setQuery("");
    try {
      const lov = await validateLovFieldClientes(id);
      onSelect(lov);
      const preset = await loadPresetClientData(id).catch(() => null);
      if (preset) onPresetLoaded(preset);
    } catch { /* ignore */ }
  };

  const handleInlineAdd = async () => {
    if (!addForm.nombre || !addForm.rfc || !addForm.codigo_postal || !addForm.regimen_fiscal_id) {
      setAddError("Todos los campos marcados con * son requeridos"); return;
    }
    setAddSaving(true); setAddError(null);
    try {
      const res = await addCliente({
        nombre: addForm.nombre, rfc: addForm.rfc.toUpperCase(),
        codigo_postal: addForm.codigo_postal,
        regimen_fiscal_id: addForm.regimen_fiscal_id,
        tipo_cliente_deudor: "CLIENTE", estatus: "A", pais: "MEX",
        corporativo_id: "", corporativo_nombre: "", corporativo_rfc: "",
        calle: "", no_exterior: "", no_interior: "", c_colonia: "", colonia: "",
        c_municipio: "", municipio: "", c_localidad: "", localidad: "",
        c_estado: "", estado: "", referencia: "", tipo_cliente_id: "",
        tipo_cliente_descr: "", tax_id: "", num_reg_id_trib: "",
        dias_credito: "0", limite_credito: "0",
        metodo_de_pago: "", metodo_de_pago_descr: "", num_cta_pago: "",
        lista_precios_id: "", vendedor_id: "", vendedor_nombre: "",
        cuenta_contable: "", num_proveedor: "",
      }) as { msg: string; record: { cliente_id: string } };
      setAddOpen(false);
      setAddForm({ nombre: "", rfc: "", codigo_postal: "", regimen_fiscal_id: "" });
      await handleSelectId(res.record.cliente_id);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    } finally { setAddSaving(false); }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (readonly || clienteId) {
    return (
      <div className="rounded-lg border p-3 space-y-1 bg-muted/20">
        <p className="text-xs font-mono text-muted-foreground">{receptorRfc}</p>
        <p className="font-medium text-sm">{receptorNombre}</p>
        {!readonly && (
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 mt-1"
            onClick={() => { onSelect({ cliente_id: "", nombre: "", rfc: "", calle: null, no_exterior: null, no_interior: null, colonia: null, localidad: null, referencia: null, municipio: null, estado: null, pais: "MEX", codigo_postal: null, metodo_de_pago: null, metodo_de_pago_descr: null, lista_precios_id: "", vendedor_id: null, vendedor_nombre: null, num_cta_pago: null, dias_credito: "0", limite_credito: "0", fecha_vencimiento: "", estatus: "A", regimen_fiscal_id: "", empresa_id: "", corporativo_id: "" }); }}>
            Cambiar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {searching
          ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
        <Input
          className="pl-8"
          placeholder="Buscar cliente por nombre o RFC…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query && setShowDrop(true)}
        />
      </div>
      {showDrop && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 && !searching && (
            <div className="p-2 text-sm text-muted-foreground">Sin resultados</div>
          )}
          {results.map((r) => (
            <button key={r.cliente_id} type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => handleSelectId(r.cliente_id)}>
              <span className="font-medium">{r.nombre}</span>
              <span className="text-xs text-muted-foreground ml-2 font-mono">{r.rfc}</span>
            </button>
          ))}
          <button type="button"
            className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-accent flex items-center gap-1 border-t"
            onClick={() => { setShowDrop(false); setAddOpen(true); }}>
            <Plus className="h-3 w-3" /> Registrar cliente nuevo
          </button>
        </div>
      )}
      <InlineModal open={addOpen} onClose={() => { setAddOpen(false); setAddError(null); }} title="Nuevo cliente">
        <div className="space-y-3">
          {addError && <Alert variant="destructive"><AlertDescription>{addError}</AlertDescription></Alert>}
          <div className="space-y-1">
            <Label>RFC *</Label>
            <Input value={addForm.rfc} onChange={e => setAddForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} className="uppercase" />
          </div>
          <div className="space-y-1">
            <Label>Razón social *</Label>
            <Input value={addForm.nombre} onChange={e => setAddForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Régimen fiscal *</Label>
            <Select value={addForm.regimen_fiscal_id} onValueChange={v => setAddForm(p => ({ ...p, regimen_fiscal_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {regimenFiscalOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.value} – {o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>CP fiscal *</Label>
            <Input value={addForm.codigo_postal} onChange={e => setAddForm(p => ({ ...p, codigo_postal: e.target.value }))} maxLength={5} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setAddOpen(false); setAddError(null); }} disabled={addSaving}>Cancelar</Button>
            <Button className="flex-1" onClick={handleInlineAdd} disabled={addSaving}>
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Guardar
            </Button>
          </div>
        </div>
      </InlineModal>
    </div>
  );
}

// ─── ProductoPicker ───────────────────────────────────────────────────────────

interface ProductoPickerProps {
  listaPreciosId: string;
  monedaId: string;
  tipoCambio: string;
  onAdd: (concepto: DraftConcepto) => void;
}

function ProductoPicker({ listaPreciosId, monedaId, tipoCambio, onAdd }: ProductoPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkuLov[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    sku: "", descripcion: "", unidad_id: "PZ",
    clave_prod_ser_sat: "", almacenable: "S", esquema_impuestos_id: "GENERAL",
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const debRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      if (q.trim()) {
        // Try exact SKU first
        try {
          const exact = await validateSku(q.trim(), listaPreciosId);
          setResults([exact]);
          setShowDrop(true);
          return;
        } catch { /* not exact match, fall through */ }
      }
      const res = await searchSkuForFactura(q, listaPreciosId);
      setResults(res.records ?? []);
      setShowDrop(true);
    } catch { setResults([]); setShowDrop(true); }
    finally { setSearching(false); }
  }, [listaPreciosId]);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSelect = (sku: SkuLov) => {
    onAdd(conceptoFromSku(sku, monedaId, tipoCambio));
    setQuery(""); setShowDrop(false); setResults([]);
  };

  const handleInlineAdd = async () => {
    if (!addForm.sku || !addForm.descripcion || !addForm.unidad_id || !addForm.clave_prod_ser_sat) {
      setAddError("SKU, descripción, unidad y clave SAT son requeridos"); return;
    }
    setAddSaving(true); setAddError(null);
    try {
      await addProducto({
        sku: addForm.sku, descripcion: addForm.descripcion,
        unidad_id: addForm.unidad_id, clave_prod_ser_sat: addForm.clave_prod_ser_sat,
        almacenable: addForm.almacenable, esquema_impuestos_id: addForm.esquema_impuestos_id,
        estatus: "A", costeo: "PROMEDIO", es_paquete: "N", es_perecedero: "N",
        usa_lotes: "N", usa_series: "N",
        codigo_ean: "", marca: "", modelo: "", caracteristicas: "", especificaciones: "",
        composicion: "", costo_promedio_mn: "0", categoria_contable_id: "",
        clave_prod_ser_sat_desc: "", clasificacion_abc: "",
        mostrar_en_ecommerce: "N", categoria: "", fraccion_arancelaria: "",
        sat_cporte_peso_en_kg: "", fotografia: "",
      });
      // Validate to get full SkuLov
      const skuLov = await validateSku(addForm.sku, listaPreciosId);
      onAdd(conceptoFromSku(skuLov, monedaId, tipoCambio));
      setAddOpen(false);
      setAddForm({ sku: "", descripcion: "", unidad_id: "PZ", clave_prod_ser_sat: "", almacenable: "S", esquema_impuestos_id: "GENERAL" });
      setQuery(""); setShowDrop(false);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    } finally { setAddSaving(false); }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {searching
          ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
        <Input
          className="pl-8"
          placeholder="Buscar o ingresar SKU de producto…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => !query && doSearch("")}
        />
      </div>
      {showDrop && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 && !searching && (
            <div className="p-2 text-sm text-muted-foreground">Sin resultados para "{query}"</div>
          )}
          {results.map((r) => (
            <button key={r.sku} type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => handleSelect(r)}>
              <span className="font-mono font-medium">{r.sku}</span>
              <span className="text-muted-foreground ml-2 truncate">{r.descripcion}</span>
            </button>
          ))}
          <button type="button"
            className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-accent flex items-center gap-1 border-t"
            onClick={() => { setShowDrop(false); setAddOpen(true); }}>
            <Plus className="h-3 w-3" /> Agregar producto nuevo
          </button>
        </div>
      )}
      <InlineModal open={addOpen} onClose={() => { setAddOpen(false); setAddError(null); }} title="Nuevo producto">
        <div className="space-y-3">
          {addError && <Alert variant="destructive"><AlertDescription>{addError}</AlertDescription></Alert>}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 col-span-2">
              <Label>SKU *</Label>
              <Input value={addForm.sku} onChange={e => setAddForm(p => ({ ...p, sku: e.target.value.toUpperCase() }))} className="uppercase" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Descripción *</Label>
              <Input value={addForm.descripcion} onChange={e => setAddForm(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Unidad *</Label>
              <Input value={addForm.unidad_id} onChange={e => setAddForm(p => ({ ...p, unidad_id: e.target.value.toUpperCase() }))} className="uppercase" />
            </div>
            <div className="space-y-1">
              <Label>Clave SAT *</Label>
              <Input value={addForm.clave_prod_ser_sat} onChange={e => setAddForm(p => ({ ...p, clave_prod_ser_sat: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Almacenable *</Label>
              <Select value={addForm.almacenable} onValueChange={v => setAddForm(p => ({ ...p, almacenable: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Sí</SelectItem>
                  <SelectItem value="N">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Esquema imp. *</Label>
              <Input value={addForm.esquema_impuestos_id} onChange={e => setAddForm(p => ({ ...p, esquema_impuestos_id: e.target.value.toUpperCase() }))} className="uppercase" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setAddOpen(false); setAddError(null); }} disabled={addSaving}>Cancelar</Button>
            <Button className="flex-1" onClick={handleInlineAdd} disabled={addSaving}>
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Guardar
            </Button>
          </div>
        </div>
      </InlineModal>
    </div>
  );
}

// ─── ConceptoSheet ────────────────────────────────────────────────────────────

interface ConceptoSheetProps {
  concepto: DraftConcepto;
  onSave: (c: DraftConcepto) => void;
  onClose: () => void;
}

function ConceptoSheet({ concepto, onSave, onClose }: ConceptoSheetProps) {
  const [c, setC] = useState<DraftConcepto>({ ...concepto });
  const base = calcBase(c);

  const setField = (field: keyof DraftConcepto, value: string) =>
    setC(prev => ({ ...prev, [field]: value }));

  const addTraslado = () => setC(prev => ({
    ...prev,
    impuestos_traslados: [...prev.impuestos_traslados, {
      _key: newKey(), aplicacion: "T", impuesto: "IVA",
      tipo_factor: "Tasa", tasa: "16.0000", esquema_impuestos_id: "GENERAL", num_impuesto: "1",
    }],
  }));
  const addRetencion = () => setC(prev => ({
    ...prev,
    impuestos_retenciones: [...prev.impuestos_retenciones, {
      _key: newKey(), aplicacion: "R", impuesto: "ISR",
      tipo_factor: "Tasa", tasa: "10.0000", esquema_impuestos_id: "GENERAL", num_impuesto: "1",
    }],
  }));

  const updateImp = (arr: DraftImpuesto[], key: string, field: keyof DraftImpuesto, val: string) =>
    arr.map(i => i._key === key ? { ...i, [field]: val } : i);

  const removeImp = (arr: DraftImpuesto[], key: string) => arr.filter(i => i._key !== key);

  // Show price list selector only if > 1 price list
  const priceLists = c.precios.map(p => ({ id: p[0], precio: p[1], moneda: p[2] }));
  const showListaPicker = priceLists.length > 1;

  return (
    <InlineModal open onClose={onClose} title="Editar concepto" className="sm:max-w-xl">
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        <div className="space-y-1">
          <Label>Descripción</Label>
          <Input value={c.descripcion} onChange={e => setField("descripcion", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input type="number" min="0" step="any" value={c.cantidad} onChange={e => setField("cantidad", e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Precio unitario</Label>
            <Input type="number" min="0" step="any" value={c.precio_unitario} onChange={e => setField("precio_unitario", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Descuento</Label>
            <Input type="number" min="0" step="any" value={c.descuento} onChange={e => setField("descuento", e.target.value)} />
          </div>
          {showListaPicker && (
            <div className="space-y-1">
              <Label>Lista precios</Label>
              <Select value={c.lista_precios_id} onValueChange={v => {
                const pl = priceLists.find(p => p.id === v);
                setC(prev => ({ ...prev, lista_precios_id: v, precio_unitario: pl?.precio ?? prev.precio_unitario }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priceLists.map(p => <SelectItem key={p.id} value={p.id}>{p.id} ({p.moneda} {p.precio})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Impuestos */}
        <div className="border rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Impuestos</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addTraslado}>
                <Plus className="h-3 w-3 mr-1" />Traslado
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addRetencion}>
                <Plus className="h-3 w-3 mr-1" />Retención
              </Button>
            </div>
          </div>
          {c.impuestos_traslados.length === 0 && c.impuestos_retenciones.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">Sin impuestos</p>
          )}
          {[...c.impuestos_traslados.map(i => ({ ...i, _tipo: "T" as const })),
            ...c.impuestos_retenciones.map(i => ({ ...i, _tipo: "R" as const }))].map(imp => (
            <div key={imp._key} className="grid grid-cols-12 gap-1 items-center text-xs">
              <div className="col-span-3">
                <Badge variant={imp._tipo === "T" ? "default" : "secondary"} className="text-[10px]">
                  {imp._tipo === "T" ? "Traslado" : "Retención"}
                </Badge>
              </div>
              <div className="col-span-3">
                <Select value={imp.impuesto} onValueChange={v => {
                  if (imp._tipo === "T") setC(p => ({ ...p, impuestos_traslados: updateImp(p.impuestos_traslados, imp._key, "impuesto", v) }));
                  else setC(p => ({ ...p, impuestos_retenciones: updateImp(p.impuestos_retenciones, imp._key, "impuesto", v) }));
                }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["IVA", "ISR", "IEPS"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 flex items-center gap-0.5">
                <Input className="h-7 text-xs" type="number" step="any" value={imp.tasa}
                  onChange={e => {
                    if (imp._tipo === "T") setC(p => ({ ...p, impuestos_traslados: updateImp(p.impuestos_traslados, imp._key, "tasa", e.target.value) }));
                    else setC(p => ({ ...p, impuestos_retenciones: updateImp(p.impuestos_retenciones, imp._key, "tasa", e.target.value) }));
                  }} />
                <span className="text-muted-foreground">%</span>
              </div>
              <div className="col-span-2 text-right text-muted-foreground font-mono">
                ${fmt(calcImpImporte(base, imp.tasa, imp.tipo_factor))}
              </div>
              <button type="button" className="col-span-1 flex justify-center text-destructive"
                onClick={() => {
                  if (imp._tipo === "T") setC(p => ({ ...p, impuestos_traslados: removeImp(p.impuestos_traslados, imp._key) }));
                  else setC(p => ({ ...p, impuestos_retenciones: removeImp(p.impuestos_retenciones, imp._key) }));
                }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t pt-2 flex justify-between text-sm font-medium">
          <span>Importe concepto</span>
          <span className="font-mono">${fmt(base)}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t mt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={() => onSave(c)}>
          <Check className="h-4 w-4 mr-1" />OK
        </Button>
      </div>
    </InlineModal>
  );
}

// ─── CancelDialog ─────────────────────────────────────────────────────────────

const MOTIVOS = [
  { value: "01", label: "01 – Con relación" },
  { value: "02", label: "02 – Sin relación" },
  { value: "03", label: "03 – No se llevó a cabo" },
  { value: "04", label: "04 – Operación nominativa" },
];

function CancelDialog({
  open, serie, folio, onClose, onConfirm, saving,
}: {
  open: boolean; serie: string; folio: string;
  onClose: () => void;
  onConfirm: (motivo: string, folioSustituto: string) => void;
  saving: boolean;
}) {
  const [motivo, setMotivo] = useState("02");
  const [folioSustituto, setFolioSustituto] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Cancelar {serie}-{folio}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Motivo SAT</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MOTIVOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {motivo === "01" && (
            <div className="space-y-1">
              <Label>Folio sustituto (serie-folio o UUID)</Label>
              <Input value={folioSustituto} onChange={e => setFolioSustituto(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="destructive" onClick={() => onConfirm(motivo, folioSustituto)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Solicitar cancelación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MailDialog ───────────────────────────────────────────────────────────────

function MailDialog({
  open, serie, folio, receptorNombre, onClose, onSend, saving, sent, error,
}: {
  open: boolean; serie: string; folio: string; receptorNombre: string;
  onClose: () => void;
  onSend: (nombre: string, correo: string, asunto: string) => void;
  saving: boolean; sent: boolean; error: string | null;
}) {
  const [nombre, setNombre] = useState(receptorNombre);
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState(`Factura ${serie}-${folio}`);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Enviar {serie}-{folio}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {sent && <p className="text-sm text-green-600 font-medium">Correo enviado.</p>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-1"><Label>Nombre</Label><Input value={nombre} onChange={e => setNombre(e.target.value)} disabled={saving || sent} /></div>
          <div className="space-y-1"><Label>Correo</Label><Input type="email" value={correo} onChange={e => setCorreo(e.target.value)} disabled={saving || sent} placeholder="correo@ejemplo.com" /></div>
          <div className="space-y-1"><Label>Asunto</Label><Input value={asunto} onChange={e => setAsunto(e.target.value)} disabled={saving || sent} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cerrar</Button>
          <Button onClick={() => onSend(nombre, correo, asunto)} disabled={saving || sent || !correo}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FacturaDetail (main) ─────────────────────────────────────────────────────

export default function FacturaDetail() {
  const { serie, folio } = useParams<{ serie: string; folio: string }>();
  const navigate = useNavigate();
  const {
    state: facturasState, loadOne,
    addPrefactura, updatePrefactura, addFactura, stamp, cancel, sendMail, printPdf,
  } = useFacturas();
  const { regimenFiscal, formaPago, metodoPago, usoCfdi, moneda, ensure } = useCatalogos();
  const { empresaId } = useAuth();

  const isNew = !serie && !folio;

  const [draft, setDraft] = useState<FacturaDraft>(newDraft);
  const [loadingFact, setLoadingFact] = useState(!isNew);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [comprobantOpen, setComprobantOpen] = useState(true);
  const [divisaOpen, setDivisaOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [editConcepto, setEditConcepto] = useState<{ c: DraftConcepto; idx: number } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);

  const [mailOpen, setMailOpen] = useState(false);
  const [mailSaving, setMailSaving] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailErr, setMailErr] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);

  // Swipe state
  const touchStart = useRef<number>(0);
  const [swipedIdx, setSwipedIdx] = useState<number | null>(null);

  // Ensure catalogs
  useEffect(() => {
    ensure("regimenFiscal"); ensure("formaPago");
    ensure("metodoPago"); ensure("usoCfdi"); ensure("moneda");
  }, [ensure]);

  // Load existing factura
  useEffect(() => {
    if (!isNew && serie && folio) {
      setLoadingFact(true);
      setLoadErr(null);
      loadOne(serie, folio)
        .catch(e => setLoadErr(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoadingFact(false));
    }
  }, [serie, folio, isNew, loadOne]);

  useEffect(() => {
    if (!isNew && facturasState.selected) {
      setDraft(draftFromFactura(facturasState.selected));
    }
  }, [facturasState.selected, isNew]);

  const isReadOnly = !isNew && (draft.estatus === "R" || draft.estatus === "C");
  const isPrefactura = !isNew && draft.estatus === "P";

  const setDraftField = <K extends keyof FacturaDraft>(key: K, value: FacturaDraft[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  // ── Client selection
  const handleClientSelect = (lov: ClienteLov) => {
    if (!lov.cliente_id) {
      // "Cambiar" button: reset
      setDraft(prev => ({
        ...prev, clienteId: "", receptorNombre: "", receptorRfc: "",
        receptorRegimenFiscalId: "", calle: "", noExterior: "", noInterior: "",
        colonia: "", municipio: "", codigoPostal: "", localidad: "", estado: "", pais: "MEX",
      }));
      return;
    }
    setDraft(prev => ({
      ...prev,
      clienteId: lov.cliente_id,
      receptorNombre: lov.nombre,
      receptorRfc: lov.rfc,
      receptorRegimenFiscalId: lov.regimen_fiscal_id,
      formaPago: lov.metodo_de_pago || prev.formaPago,
      formaPagoDescr: lov.metodo_de_pago_descr || prev.formaPagoDescr,
      listaPreciosId: lov.lista_precios_id || prev.listaPreciosId,
      vendedorId: lov.vendedor_id || prev.vendedorId,
      vendedorNombre: lov.vendedor_nombre || prev.vendedorNombre,
      calle: lov.calle || prev.calle,
      noExterior: lov.no_exterior || prev.noExterior,
      noInterior: lov.no_interior || prev.noInterior,
      colonia: lov.colonia || prev.colonia,
      municipio: lov.municipio || prev.municipio,
      codigoPostal: lov.codigo_postal || prev.codigoPostal,
      localidad: lov.localidad || prev.localidad,
      estado: lov.estado || prev.estado,
      pais: lov.pais || prev.pais,
    }));
  };

  const handlePresetLoaded = (f: FacturaCompleta) => {
    setDraft(prev => ({
      ...prev,
      usoCfdiId: f.uso_id || prev.usoCfdiId,
      usoCfdiDescr: f.uso_descr || prev.usoCfdiDescr,
      metodoPago: f.metodo_pago || prev.metodoPago,
      metodoPagoDescr: f.metodo_pago_descr || prev.metodoPagoDescr,
    }));
  };

  // ── Build payload and save
  const doSave = async (action: "prefactura" | "timbrar") => {
    if (!draft.clienteId) { setSaveErr("Selecciona un cliente"); return; }
    if (draft.conceptos.length === 0) { setSaveErr("Agrega al menos un concepto"); return; }
    setSaving(true); setSaveErr(null); setSaveMsg(null);
    const payload = buildPayload(draft);
    try {
      let res: { msg: string; record: FacturaCompleta };
      if (action === "prefactura") {
        res = isNew ? await addPrefactura(payload) : await updatePrefactura(payload);
      } else {
        res = isNew ? await addFactura(payload) : await stamp(payload);
      }
      setSaveMsg(res.msg);
      navigate(`/facturas/${res.record.serie}/${res.record.folio}`, { replace: true });
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  };

  const handleCancel = async (motivo: string, folioSustituto: string) => {
    if (!serie || !folio) return;
    setCancelSaving(true);
    try {
      const res = await cancel(serie, folio, motivo, folioSustituto);
      setSaveMsg(res.msg);
      setCancelOpen(false);
      // Reload
      loadOne(serie, folio).catch(() => null);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e));
      setCancelOpen(false);
    } finally { setCancelSaving(false); }
  };

  const handlePdf = async () => {
    if (!draft.serie || !draft.folio) return;
    setPdfLoading(true);
    try {
      const data = await printPdf(empresaId ?? "", draft.serie, draft.folio, "");
      window.open(data, "_blank");
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e));
    } finally { setPdfLoading(false); }
  };

  const handleSendMail = async (nombre: string, correo: string, asunto: string) => {
    if (!draft.serie || !draft.folio) return;
    setMailSaving(true); setMailErr(null);
    try {
      await sendMail(draft.serie, draft.folio, nombre, correo, asunto);
      setMailSent(true);
      setTimeout(() => { setMailOpen(false); setMailSent(false); }, 1500);
    } catch (e) {
      setMailErr(e instanceof Error ? e.message : String(e));
    } finally { setMailSaving(false); }
  };

  // ── Totales
  const totales = draft.conceptos.length > 0 ? calcTotales(draft.conceptos) : null;

  // ── Helper: Select option label
  const optLabel = (options: { value: string; label: string }[], val: string) =>
    options.find(o => o.value === val)?.label ?? val;

  if (loadingFact) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="p-4">
        <Alert variant="destructive"><AlertDescription>{loadErr}</AlertDescription></Alert>
      </div>
    );
  }

  const title = isNew ? "Nueva Factura" : `Factura ${draft.serie}-${draft.folio}`;

  return (
    <div className="flex flex-col h-full">
      {/* TopBar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold leading-tight">{title}</h1>
            {draft.estatus && (
              <div className="mt-0.5">
                {draft.estatus === "P" && <Badge variant="secondary" className="text-[11px]">Prefactura</Badge>}
                {draft.estatus === "R" && <Badge className="text-[11px] bg-green-600 hover:bg-green-700">Timbrada</Badge>}
                {draft.estatus === "C" && <Badge variant="destructive" className="text-[11px]">Cancelada</Badge>}
              </div>
            )}
          </div>
        </div>
        {draft.uuid && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">{draft.uuid}</p>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* Messages */}
          {saveErr && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-start gap-2">
                {saveErr}
                <button type="button" onClick={() => setSaveErr(null)} className="ml-auto shrink-0"><X className="h-4 w-4" /></button>
              </AlertDescription>
            </Alert>
          )}
          {saveMsg && (
            <Alert>
              <AlertDescription className="text-green-700">{saveMsg}</AlertDescription>
            </Alert>
          )}

          {/* ── CLIENTE ── */}
          <section className="border rounded-lg">
            <div className="bg-muted/40 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
            </div>
            <div className="p-3 space-y-3">
              <ClientePicker
                clienteId={draft.clienteId}
                receptorNombre={draft.receptorNombre}
                receptorRfc={draft.receptorRfc}
                readonly={isReadOnly}
                onSelect={handleClientSelect}
                onPresetLoaded={handlePresetLoaded}
                regimenFiscalOptions={regimenFiscal.options}
              />
              {draft.clienteId && (
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Uso CFDI: </span>
                    {!isReadOnly ? (
                      <Select value={draft.usoCfdiId} onValueChange={v => {
                        setDraftField("usoCfdiId", v);
                        setDraftField("usoCfdiDescr", optLabel(usoCfdi.options, v));
                      }}>
                        <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {usoCfdi.options.map(o => <SelectItem key={o.value} value={o.value}>{o.value} – {o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <span>{draft.usoCfdiId} – {draft.usoCfdiDescr}</span>}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Régimen: </span>
                    <span>{draft.receptorRegimenFiscalId}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── COMPROBANTE ── */}
          <section className="border rounded-lg overflow-hidden">
            <button type="button"
              className="w-full flex items-center justify-between bg-muted/40 px-3 py-2"
              onClick={() => setComprobantOpen(o => !o)}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comprobante</p>
              {comprobantOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {comprobantOpen && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Método pago</Label>
                    {!isReadOnly ? (
                      <Select value={draft.metodoPago} onValueChange={v => {
                        setDraftField("metodoPago", v);
                        setDraftField("metodoPagoDescr", optLabel(metodoPago.options, v));
                      }}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {metodoPago.options.map(o => <SelectItem key={o.value} value={o.value}>{o.value} – {o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <p className="text-sm">{draft.metodoPago}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Forma pago</Label>
                    {!isReadOnly ? (
                      <Select value={draft.formaPago} onValueChange={v => {
                        setDraftField("formaPago", v);
                        setDraftField("formaPagoDescr", optLabel(formaPago.options, v));
                      }}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {formaPago.options.map(o => <SelectItem key={o.value} value={o.value}>{o.value} – {o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <p className="text-sm">{draft.formaPago} – {draft.formaPagoDescr}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Fecha</Label>
                    {!isReadOnly
                      ? <Input type="date" className="h-8 text-sm" value={draft.fecha} onChange={e => setDraftField("fecha", e.target.value)} />
                      : <p className="text-sm">{draft.fecha}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vence</Label>
                    {!isReadOnly
                      ? <Input type="date" className="h-8 text-sm" value={draft.fechaVencimiento} onChange={e => setDraftField("fechaVencimiento", e.target.value)} />
                      : <p className="text-sm">{draft.fechaVencimiento}</p>}
                  </div>
                </div>

                {!isNew && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Serie</Label>
                      <p className="text-sm font-mono">{draft.serie || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Folio</Label>
                      <p className="text-sm font-mono">{draft.folio || "—"}</p>
                    </div>
                  </div>
                )}

                {/* Divisa expandible */}
                <button type="button"
                  className="flex items-center gap-1 text-xs text-primary"
                  onClick={() => setDivisaOpen(o => !o)}>
                  {divisaOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {divisaOpen ? "Ocultar Divisa / T.C." : "+ Divisa / T.C."}
                </button>
                {divisaOpen && (
                  <div className="grid grid-cols-2 gap-2 border rounded p-2 bg-muted/20">
                    <div className="space-y-1">
                      <Label className="text-xs">Moneda</Label>
                      {!isReadOnly ? (
                        <Select value={draft.monedaId} onValueChange={v => {
                          const rec = moneda.records.find(r => r.moneda_id === v);
                          setDraftField("monedaId", v);
                          if (rec) {
                            setDraftField("tipoCambio", rec.tipo_cambio);
                            setDraftField("decimalesSat", rec.decimales_sat);
                          }
                        }}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {moneda.options.map(o => <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : <p className="text-sm">{draft.monedaId}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de cambio</Label>
                      {!isReadOnly
                        ? <Input className="h-8 text-sm" type="number" step="any" value={draft.tipoCambio} onChange={e => setDraftField("tipoCambio", e.target.value)} disabled={draft.monedaId === "MXN"} />
                        : <p className="text-sm">{draft.tipoCambio}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── CONCEPTOS ── */}
          <section className="border rounded-lg">
            <div className="bg-muted/40 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conceptos</p>
            </div>
            <div className="divide-y">
              {draft.conceptos.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">Sin conceptos</p>
              )}
              {draft.conceptos.map((c, idx) => {
                const base = calcBase(c);
                const allImps = [...c.impuestos_traslados, ...c.impuestos_retenciones];
                const isSwiped = swipedIdx === idx;
                return (
                  <div key={c._key} className="relative overflow-hidden"
                    onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
                    onTouchEnd={e => {
                      const dx = e.changedTouches[0].clientX - touchStart.current;
                      if (dx < -80) setSwipedIdx(isSwiped ? null : idx);
                      else if (dx > 40) setSwipedIdx(null);
                    }}>
                    {/* Swipe actions (behind) */}
                    {isSwiped && (
                      <div className="absolute inset-y-0 right-0 flex items-center bg-destructive text-white">
                        <button type="button" className="px-4 h-full flex items-center gap-1 text-sm font-medium"
                          onClick={() => {
                            setDraft(p => ({ ...p, conceptos: p.conceptos.filter((_, i) => i !== idx) }));
                            setSwipedIdx(null);
                          }}>
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      </div>
                    )}
                    <div className={`flex gap-2 p-3 bg-background transition-transform ${isSwiped ? "-translate-x-20" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-mono text-muted-foreground">{c.sku}</p>
                            <p className="text-sm font-medium leading-tight">{c.descripcion}</p>
                          </div>
                          {!isReadOnly && (
                            <div className="flex gap-1 shrink-0 ml-2">
                              <button type="button" onClick={() => setEditConcepto({ c, idx })}
                                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button"
                                onClick={() => setDraft(p => ({ ...p, conceptos: p.conceptos.filter((_, i) => i !== idx) }))}
                                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.cantidad} {c.unidad_id} × ${fmt(parseFloat(c.precio_unitario) || 0)}
                        </p>
                        {allImps.map(imp => (
                          <p key={imp._key} className="text-xs text-muted-foreground">
                            {imp.aplicacion === "T" ? "Traslado" : "Retención"} {imp.impuesto} {imp.tasa}%:{" "}
                            {imp.aplicacion === "R" ? "−" : ""}${fmt(calcImpImporte(base, imp.tasa, imp.tipo_factor))}
                          </p>
                        ))}
                        <p className="text-sm font-medium text-right mt-1">
                          Total: ${fmt(base + allImps.filter(i => i.aplicacion === "T").reduce((s, i) => s + calcImpImporte(base, i.tasa, i.tipo_factor), 0)
                            - allImps.filter(i => i.aplicacion === "R").reduce((s, i) => s + calcImpImporte(base, i.tasa, i.tipo_factor), 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isReadOnly && (
              <div className="p-3 border-t">
                <ProductoPicker
                  listaPreciosId={draft.listaPreciosId}
                  monedaId={draft.monedaId}
                  tipoCambio={draft.tipoCambio}
                  onAdd={c => setDraft(p => ({ ...p, conceptos: [...p.conceptos, c] }))}
                />
              </div>
            )}
          </section>

          {/* ── TOTALES ── */}
          {totales && (
            <section className="border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Totales</p>
              </div>
              <div className="p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">${fmt(totales.subtotal)}</span>
                </div>
                {totales.rows.map(r => (
                  <div key={`${r.aplicacion}:${r.impuesto}:${r.tasa}`} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {r.aplicacion === "T" ? "Traslado" : "Retención"} {r.impuesto} {r.tasa}%
                    </span>
                    <span className="font-mono">{r.aplicacion === "R" ? "−" : ""}${fmt(r.importe)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total {draft.monedaId !== "MXN" ? `(${draft.monedaId})` : ""}</span>
                  <span className="font-mono">${fmt(totales.total)}</span>
                </div>
              </div>
            </section>
          )}

          {/* ── PAGO (solo PUE) ── */}
          {draft.metodoPago === "PUE" && !isReadOnly && (
            <section className="border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pago integrado (PUE)</p>
              </div>
              <div className="p-3 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cuenta cobro</Label>
                  <Input className="h-8 text-sm" value={draft.cuentaCobroId} onChange={e => setDraftField("cuentaCobroId", e.target.value)} placeholder="ID cuenta cobro" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Referencia</Label>
                  <Input className="h-8 text-sm" value={draft.referenciaPago} onChange={e => setDraftField("referenciaPago", e.target.value)} placeholder="Referencia de pago" />
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-2 z-20">
        <div className="max-w-2xl mx-auto">
          {!isReadOnly ? (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={saving}
                onClick={() => doSave("prefactura")}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {isPrefactura ? "Actualizar" : "Prefactura"}
              </Button>
              <Button className="flex-1" disabled={saving}
                onClick={() => doSave("timbrar")}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Timbrar ▶
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={pdfLoading} onClick={handlePdf}>
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                PDF
              </Button>
              {draft.estatus === "R" && (
                <Button variant="outline" className="flex-1" onClick={() => { setMailOpen(true); setMailSent(false); setMailErr(null); }}>
                  <Mail className="h-4 w-4 mr-1" />Correo
                </Button>
              )}
              {draft.estatus === "R" && (
                <Button variant="outline" className="flex-none px-3" onClick={() => setCancelOpen(true)}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Concepto Sheet ── */}
      {editConcepto && (
        <ConceptoSheet
          concepto={editConcepto.c}
          onSave={updated => {
            const idx = editConcepto.idx;
            setDraft(p => {
              const conceptos = [...p.conceptos];
              conceptos[idx] = updated;
              return { ...p, conceptos };
            });
            setEditConcepto(null);
          }}
          onClose={() => setEditConcepto(null)}
        />
      )}

      {/* ── Cancel Dialog ── */}
      <CancelDialog
        open={cancelOpen}
        serie={draft.serie}
        folio={draft.folio}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        saving={cancelSaving}
      />

      {/* ── Mail Dialog ── */}
      <MailDialog
        open={mailOpen}
        serie={draft.serie}
        folio={draft.folio}
        receptorNombre={draft.receptorNombre}
        onClose={() => setMailOpen(false)}
        onSend={handleSendMail}
        saving={mailSaving}
        sent={mailSent}
        error={mailErr}
      />
    </div>
  );
}
