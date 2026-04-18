import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, ChevronDown, ChevronUp,
  Loader2, FileText, Mail, MoreHorizontal, UserPlus, PackagePlus, FilePlus2,
} from "lucide-react";
import { useFacturas } from "@/context/FacturasContext";
import { useCatalogos } from "@/context/CatalogosContext";
import { useAuth } from "@/hooks/useAuth";
import type { ClienteLov, FacturaCompleta } from "@/api/endpoints/facturas";
import { searchCuentasBancariasCliente, validateLovFieldClientesIngresos } from "@/api/endpoints/ingresos";
import type { CuentaBancaria } from "@/api/endpoints/ingresos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSnackbar } from "@/context/useSnackbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { DraftConcepto, FacturaDraft } from "@/modules/facturacion/types";
import { calcBase, calcImpImporte, calcTotales, fmt } from "@/modules/facturacion/facturaUtils";
import { newDraft, draftFromFactura, buildPayload } from "@/modules/facturacion/facturaMappers";
import { ClientePickerInline, type ClientePickerInlineHandle } from "@/modules/facturacion/ClientePickerInline";
import { ProductoPickerInline, type ProductoPickerInlineHandle } from "@/modules/facturacion/ProductoPickerInline";
import { ConceptoSheet } from "@/modules/facturacion/ConceptoSheet";
import { CancelDialog } from "@/modules/facturacion/CancelDialog";
import { MailDialog } from "@/modules/facturacion/MailDialog";
import { PdfSheet } from "@/modules/facturacion/PdfSheet";
import { PDF_SHEET_CLOSED, type PdfSheetState } from "@/modules/facturacion/pdfSheetState";

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
  const { showError, showSuccess } = useSnackbar();

  const [draft, setDraft] = useState<FacturaDraft>(newDraft);
  const [loadingFact, setLoadingFact] = useState(!isNew);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [comprobantOpen, setComprobantOpen] = useState(true);
  const [divisaOpen, setDivisaOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [clienteLoading, setClienteLoading] = useState(false);

  const [editConcepto, setEditConcepto] = useState<{ c: DraftConcepto; idx: number } | null>(null);
  const clientePickerRef = useRef<ClientePickerInlineHandle>(null);
  const productoPickerRef = useRef<ProductoPickerInlineHandle>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);

  const [mailOpen, setMailOpen] = useState(false);
  const [mailSaving, setMailSaving] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailErr, setMailErr] = useState<string | null>(null);

  const [pdfSheet, setPdfSheet] = useState<PdfSheetState>(PDF_SHEET_CLOSED);
  const [cuentasBancariasCliente, setCuentasBancariasCliente] = useState<CuentaBancaria[]>([]);

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

  const loadDatosBancarios = (clienteId: string) => {
    Promise.allSettled([
      validateLovFieldClientesIngresos(clienteId),
      searchCuentasBancariasCliente(clienteId),
    ]).then(([lovRes, cuentasRes]) => {
      if (lovRes.status === "fulfilled") {
        const lov = lovRes.value;
        setDraft(prev => ({
          ...prev,
          bancoId: lov.banco_id ?? prev.bancoId,
          bancoDescr: lov.banco_descr ?? prev.bancoDescr,
          satCtaOri: lov.sat_cta_ori ?? prev.satCtaOri,
          satBancoDest: lov.sat_banco_dest ?? prev.satBancoDest,
          satBancoDestDescr: lov.sat_banco_dest_descr ?? prev.satBancoDestDescr,
          satCtaDest: lov.sat_cta_dest ?? prev.satCtaDest,
        }));
      }
      if (cuentasRes.status === "fulfilled") {
        setCuentasBancariasCliente(cuentasRes.value.records);
      }
    });
  };

  // ── Client selection ────────────────────────────────────────────────────────

  const handleClientSelect = (lov: ClienteLov) => {
    if (!lov.cliente_id) {
      setDraft(prev => ({
        ...prev, clienteId: "", receptorNombre: "", receptorRfc: "",
        receptorRegimenFiscalId: "", calle: "", noExterior: "", noInterior: "",
        colonia: "", municipio: "", codigoPostal: "", localidad: "", estado: "", pais: "MEX",
      }));
      return;
    }
    const currentMetodoPago = draft.metodoPago;
    const rawFormaPago = lov.metodo_de_pago || draft.formaPago;
    const enforcedFormaPago =
      currentMetodoPago === "PPD" ? "99"
      : currentMetodoPago === "PUE" && rawFormaPago === "99" ? "03"
      : rawFormaPago;
    const enforcedFormaPagoDescr = enforcedFormaPago === rawFormaPago && lov.metodo_de_pago_descr
      ? lov.metodo_de_pago_descr
      : formaPago.options.find(o => o.value === enforcedFormaPago)?.label ?? enforcedFormaPago;

    setDraft(prev => ({
      ...prev,
      clienteId: lov.cliente_id,
      receptorNombre: lov.nombre,
      receptorRfc: lov.rfc,
      receptorRegimenFiscalId: lov.regimen_fiscal_id,
      formaPago: enforcedFormaPago,
      formaPagoDescr: enforcedFormaPagoDescr,
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

    if (currentMetodoPago === "PUE") {
      loadDatosBancarios(lov.cliente_id);
    }
  };

  const handlePresetLoaded = (f: FacturaCompleta, clienteId: string) => {
    setDraft(prev => ({
      ...prev,
      usoCfdiId: f.uso_id || prev.usoCfdiId,
      usoCfdiDescr: f.uso_descr || prev.usoCfdiDescr,
      metodoPago: f.metodo_pago || prev.metodoPago,
      metodoPagoDescr: f.metodo_pago_descr || prev.metodoPagoDescr,
    }));
    if (f.metodo_pago === "PUE") loadDatosBancarios(clienteId);
  };

  // ── Nuevo ───────────────────────────────────────────────────────────────────

  const handleNuevo = () => {
    if (isNew) {
      setDraft(newDraft());
      setComprobantOpen(true);
      setDivisaOpen(false);
      setSwipedIdx(null);
      setEditConcepto(null);
      setCancelOpen(false);
      setMailOpen(false);
      setMailSent(false);
      setMailErr(null);
      setPdfSheet(PDF_SHEET_CLOSED);
      setCuentasBancariasCliente([]);
    } else {
      navigate("/facturas/nuevo");
    }
  };

  // ── Save / stamp ────────────────────────────────────────────────────────────

  const doSave = async (action: "prefactura" | "timbrar") => {
    if (!draft.clienteId) { showError("Selecciona un cliente"); return; }
    if (draft.conceptos.length === 0) { showError("Agrega al menos un concepto"); return; }
    setSaving(true);
    const buildAction = action === "timbrar" && isNew ? "Add" : "other";
    const payload = buildPayload(draft, buildAction);
    try {
      let res: { msg: string; record: FacturaCompleta };
      if (action === "prefactura") {
        res = isNew ? await addPrefactura(payload) : await updatePrefactura(payload);
      } else {
        res = isNew ? await addFactura(payload) : await stamp(payload);
      }
      showSuccess(res.msg);
      navigate(`/facturas/${res.record.serie}/${res.record.folio}`, { replace: true });
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  };

  const handleCancel = async (motivo: string, folioSustituto: string) => {
    if (!serie || !folio) return;
    setCancelSaving(true);
    try {
      const res = await cancel(serie, folio, motivo, folioSustituto);
      showSuccess(res.msg);
      setCancelOpen(false);
      loadOne(serie, folio).catch(() => null);
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e));
      setCancelOpen(false);
    } finally { setCancelSaving(false); }
  };

  const handlePdf = async () => {
    if (!draft.serie || !draft.folio) return;
    const filename = `Factura-${draft.serie}-${draft.folio}.pdf`;
    setPdfSheet({ open: true, loading: true, error: null, blob: null, filename });
    try {
      const blob = await printPdf(empresaId ?? "", draft.serie, draft.folio, "");
      setPdfSheet(prev => ({ ...prev, loading: false, blob }));
    } catch (e) {
      setPdfSheet(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      }));
    }
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

  // ── Derived state ───────────────────────────────────────────────────────────

  const totales = draft.conceptos.length > 0 ? calcTotales(draft.conceptos) : null;

  const optLabel = (options: { value: string; label: string }[], val: string) =>
    options.find(o => o.value === val)?.label ?? val;

  // ── Loading / error states ──────────────────────────────────────────────────

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

      {/* ── TopBar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-10">
        {/* <div className="flex items-center gap-2"> */}
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>
          <button type="button" title="Nueva factura" className="text-muted-foreground hover:text-foreground" onClick={handleNuevo}>
            <FilePlus2 className="h-5 w-5" />
          </button>
            {draft.estatus && (
              <div>
                {draft.estatus === "P" && <Badge variant="secondary" className="text-[11px]">Prefactura</Badge>}
                {draft.estatus === "R" && <Badge className="text-[11px] bg-green-600 hover:bg-green-700">Timbrada</Badge>}
                {draft.estatus === "C" && <Badge variant="destructive" className="text-[11px]">Cancelada</Badge>}
              </div>
            )}
          {/* </div> */}
        {/* </div> */}
        {/* {draft.uuid && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">{draft.uuid}</p>
          </div>
        )} */}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-auto pb-32 md:pb-20">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* ── CLIENTE ── */}
          <section className="border rounded-lg">
            <div className="bg-primary/70 px-3 py-2 rounded-t-lg flex items-center justify-between">
              <p className="section-heading">Cliente</p>
              {!isReadOnly && !draft.clienteId && (
                <button
                  type="button"
                  title="Registrar cliente nuevo"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  onClick={() => clientePickerRef.current?.openAdd()}
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="p-3 space-y-3">
              {clienteLoading ? (
                <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : (
              <ClientePickerInline
                ref={clientePickerRef}
                clienteId={draft.clienteId}
                receptorNombre={draft.receptorNombre}
                receptorRfc={draft.receptorRfc}
                readonly={isReadOnly}
                onSelect={handleClientSelect}
                onPresetLoaded={handlePresetLoaded}
                onLoadingChange={setClienteLoading}
                regimenFiscalOptions={regimenFiscal.options}
              />
              )}
              {clienteLoading && (
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {draft.clienteId && !clienteLoading && (
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
                    {!isReadOnly ? (
                      <Select value={draft.receptorRegimenFiscalId} onValueChange={v => setDraftField("receptorRegimenFiscalId", v)}>
                        <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {regimenFiscal.options.map(o => <SelectItem key={o.value} value={o.value}>{o.value} – {o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <span>{draft.receptorRegimenFiscalId}</span>}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Código Postal: </span>
                    <span>{draft.codigoPostal}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">País: </span>
                    <span>{draft.pais}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── COMPROBANTE ── */}
          <section className="border rounded-lg overflow-hidden">
            <button type="button"
              className="w-full flex items-center justify-between bg-primary/70 px-3 py-2"
              onClick={() => setComprobantOpen(o => !o)}>
              <p className="section-heading">Comprobante</p>
              {comprobantOpen ? <ChevronUp className="h-4 w-4 text-white" /> : <ChevronDown className="h-4 w-4 text-white" />}
            </button>
            {comprobantOpen && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Método pago</Label>
                    {!isReadOnly ? (
                      <Select value={draft.metodoPago} onValueChange={v => {
                        setDraft(prev => {
                          const newFormaPago =
                            v === "PPD" ? "99"
                            : v === "PUE" && prev.formaPago === "99" ? "03"
                            : prev.formaPago;
                          return {
                            ...prev,
                            metodoPago: v,
                            metodoPagoDescr: optLabel(metodoPago.options, v),
                            formaPago: newFormaPago,
                            formaPagoDescr: optLabel(formaPago.options, newFormaPago),
                            ...(v === "PUE" && totales ? { importePago: String(totales.total) } : {}),
                          };
                        });
                        if (v === "PUE" && draft.clienteId) loadDatosBancarios(draft.clienteId);
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

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs pr-2">Fecha</Label>
                    {!isReadOnly
                      ? <DateInput className="h-8 text-sm" value={draft.fecha} onChange={v => setDraftField("fecha", v)} />
                      : <p className="text-sm">{draft.fecha}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs pr-2">Vence</Label>
                    {!isReadOnly
                      ? <DateInput className="h-8 text-sm" value={draft.fechaVencimiento} onChange={v => setDraftField("fechaVencimiento", v)} />
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
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                  onClick={() => setDivisaOpen(o => !o)}>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${divisaOpen ? "rotate-180" : ""}`}
                  />
                  Moneda
                  {draft.monedaId && draft.monedaId !== "MXN" && (
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {draft.monedaId}
                    </span>
                  )}
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
            <div className="bg-primary/70 px-3 py-2 rounded-t-lg flex items-center justify-between">
              <p className="section-heading">Conceptos</p>
              {!isReadOnly && (
                <button
                  type="button"
                  title="Agregar producto nuevo"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  onClick={() => productoPickerRef.current?.openAdd()}
                >
                  <PackagePlus className="h-4 w-4" />
                </button>
              )}
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
                    {/* Swipe actions */}
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
                            <p className="text-xs font-mono text-muted-foreground">SKU: {c.sku}</p>
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
                          Clave SAT: {c.clave_prod_ser_sat }
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.cantidad} {c.unidad_id} × ${fmt(parseFloat(c.precio_unitario) || 0)}
                        </p>
                        {allImps.map(imp => (
                          <p key={imp._key} className="text-xs text-muted-foreground">
                            {imp.aplicacion === "T" ? "Traslado" : "Retención"} {imp.impuesto} {Number(imp.tasa).toFixed(1)}%:{" "}
                            {imp.aplicacion === "R" ? "−" : ""}${fmt(calcImpImporte(base, imp.tasa, imp.tipo_factor))}
                          </p>
                        ))}
                        <p className="text-sm font-medium text-right mt-1">
                          Total: ${fmt(base
                            + allImps.filter(i => i.aplicacion === "T").reduce((s, i) => s + calcImpImporte(base, i.tasa, i.tipo_factor), 0)
                            - allImps.filter(i => i.aplicacion === "R").reduce((s, i) => s + calcImpImporte(base, i.tasa, i.tipo_factor), 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isReadOnly && (
              <div className="p-3 border-t">
                <ProductoPickerInline
                  ref={productoPickerRef}
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
              <div className="bg-primary/70 px-3 py-2">
                <p className="section-heading">Totales</p>
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

          {/* ── PAGO (solo PUE, edición) ── */}
          {draft.metodoPago === "PUE" && !isReadOnly && (
            <section className="border rounded-lg overflow-hidden">
              <div className="bg-primary/70 px-3 py-2">
                <p className="section-heading">Pago integrado (PUE)</p>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Importe</Label>
                    <Input className="h-8 text-sm" type="number" step="any" value={draft.importePago} onChange={e => setDraftField("importePago", e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Referencia</Label>
                    <Input className="h-8 text-sm" value={draft.referenciaPago} onChange={e => setDraftField("referenciaPago", e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Banco origen (cliente)</Label>
                    <div className="flex gap-2">
                      <Input className="h-8 text-sm w-20" value={draft.bancoId} onChange={e => setDraftField("bancoId", e.target.value)} placeholder="Clave" />
                      <Input className="h-8 text-sm flex-1" value={draft.bancoDescr} onChange={e => setDraftField("bancoDescr", e.target.value)} placeholder="Nombre del banco" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cuenta origen (cliente)</Label>
                    {cuentasBancariasCliente.length > 0 ? (
                      <Select
                        value={draft.satCtaOri}
                        onValueChange={v => {
                          const cuenta = cuentasBancariasCliente.find(c => c.sat_cta_ori === v);
                          if (cuenta) {
                            setDraft(prev => ({
                              ...prev,
                              satCtaOri: cuenta.sat_cta_ori,
                              bancoId: cuenta.banco_id,
                              bancoDescr: cuenta.banco_descr,
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar cuenta" /></SelectTrigger>
                        <SelectContent>
                          {cuentasBancariasCliente.map(c => (
                            <SelectItem key={c.sat_cta_ori} value={c.sat_cta_ori}>
                              {c.sat_cta_ori} — {c.banco_descr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input className="h-8 text-sm" value={draft.satCtaOri} onChange={e => setDraftField("satCtaOri", e.target.value)} placeholder="No. de cuenta" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Banco destino (empresa)</Label>
                    <div className="flex gap-2">
                      <Input className="h-8 text-sm w-20" value={draft.satBancoDest} onChange={e => setDraftField("satBancoDest", e.target.value)} placeholder="Clave" />
                      <Input className="h-8 text-sm flex-1" value={draft.satBancoDestDescr} onChange={e => setDraftField("satBancoDestDescr", e.target.value)} placeholder="Nombre del banco" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cuenta destino (empresa)</Label>
                    <Input className="h-8 text-sm" value={draft.satCtaDest} onChange={e => setDraftField("satCtaDest", e.target.value)} placeholder="No. de cuenta" />
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* UUID (read) */}
        {draft?.uuid && (
          <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
            <p className="text-xs text-muted-foreground">UUID</p>
            <p className="font-mono text-xs break-all">{draft.uuid}</p>
          </div>
        )}          

        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background border-t px-4 py-3 z-40">
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
              <Button variant="outline" className="flex-1" disabled={pdfSheet.loading} onClick={handlePdf}>
                <FileText className="h-4 w-4 mr-1" />
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

      {/* ── Sub-componentes de acción ── */}
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

      <CancelDialog
        open={cancelOpen}
        serie={draft.serie}
        folio={draft.folio}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        saving={cancelSaving}
      />

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

      <PdfSheet
        state={pdfSheet}
        onClose={() => setPdfSheet(PDF_SHEET_CLOSED)}
      />
    </div>
  );
}
