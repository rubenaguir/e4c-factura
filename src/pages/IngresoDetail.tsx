import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, FileText, Mail, FilePlus2,
} from "lucide-react";
import { useIngresos } from "@/context/IngresosContext";
import { useCatalogos } from "@/context/CatalogosContext";
import type { IngresoDetalle } from "@/api/endpoints/ingresos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateInput } from "@/components/ui/date-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, X } from "lucide-react";
import { PdfSheet } from "@/modules/facturacion/PdfSheet";
import { PDF_SHEET_CLOSED, type PdfSheetState } from "@/modules/facturacion/pdfSheetState";
import { useSnackbar } from "@/context/useSnackbar";
import { useIngresoForm } from "@/hooks/useIngresoForm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFechaPago(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

function fmt(val: string, moneda = "MXN") {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${moneda !== "MXN" ? moneda + " " : ""}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ScreenState = "nueva" | "cargada" | "timbrada" | "cancelada";

function deriveScreenState(ingreso: IngresoDetalle | null): ScreenState {
  if (!ingreso) return "nueva";
  if (ingreso.estatus === "C") return "cancelada";
  if (ingreso.uuid) return "timbrada";
  return "cargada";
}

const MOTIVOS_CANCEL = [
  { value: "01", label: "01 – Con relación" },
  { value: "02", label: "02 – Sin relación" },
  { value: "03", label: "03 – No se llevó a cabo" },
  { value: "04", label: "04 – Operación nominativa" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  nombre: string;
  onNombreChange: (v: string) => void;
  correo: string;
  onCorreoChange: (v: string) => void;
  onSend: () => void;
  saving: boolean;
  sent: boolean;
}

function MailDialog({ open, onClose, title, nombre, onNombreChange, correo, onCorreoChange, onSend, saving, sent }: MailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Enviar {title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {sent && <p className="text-sm text-green-600 font-medium">Correo enviado.</p>}
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e => onNombreChange(e.target.value)} disabled={saving || sent} />
          </div>
          <div className="space-y-1">
            <Label>Correo electrónico</Label>
            <Input type="email" value={correo} onChange={e => onCorreoChange(e.target.value)}
              disabled={saving || sent} placeholder="correo@ejemplo.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cerrar</Button>
          <Button onClick={onSend} disabled={saving || sent || !correo}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Enviando…</> : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  motivo: string;
  onMotivoChange: (v: string) => void;
  onConfirm: () => void;
  saving: boolean;
}

function CancelDialog({ open, onClose, title, motivo, onMotivoChange, onConfirm, saving }: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Cancelar {title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Motivo SAT</Label>
            <Select value={motivo} onValueChange={onMotivoChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOTIVOS_CANCEL.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cerrar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Cancelando…</> : "Solicitar cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IngresoDetail() {
  const { serie, folio } = useParams<{ serie: string; folio: string }>();
  const navigate = useNavigate();
  const isNew = !serie && !folio;

  const { loadOne, add, stamp, cancel, sendMail, printPdf } = useIngresos();
  const { formaPago, ensure } = useCatalogos();
  const { showError, showSuccess } = useSnackbar();

  const form = useIngresoForm();

  // Page-level state
  const [ingreso, setIngreso] = useState<IngresoDetalle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [pdfSheet, setPdfSheet] = useState<PdfSheetState>(PDF_SHEET_CLOSED);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailNombre, setMailNombre] = useState("");
  const [mailCorreo, setMailCorreo] = useState("");
  const [mailSaving, setMailSaving] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("02");
  const [cancelSaving, setCancelSaving] = useState(false);

  useEffect(() => { ensure("formaPago"); }, [ensure]);

  useEffect(() => {
    if (!isNew && serie && folio) {
      setLoadingPage(true);
      loadOne(serie, folio)
        .then(record => {
          setIngreso(record);
          form.populateFromIngreso(record);
          setMailNombre(record.nombre);
        })
        .catch(err => setLoadError(err instanceof Error ? err.message : String(err)))
        .finally(() => setLoadingPage(false));
    }
  }, [serie, folio]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGuardar = async () => {
    const err = form.validate();
    if (err) { showError(err); return; }
    setSaving(true);
    try {
      const res = await add({
        serie: "", folio: "", observaciones: "", estatus_sat: "",
        fecha_pago: buildFechaPago(form.fechaPagoIso),
        cliente_id: form.clienteId,
        nombre: form.clienteNombre,
        rfc: form.clienteRfc,
        receptor_regimen_fiscal_id: form.clienteRegimen,
        codigo_postal: form.clienteCP,
        descripcion: form.descripcion,
        moneda_id: form.monedaId,
        tipo_cambio: form.tipoCambio,
        forma_pago: form.formaPagoId,
        forma_pago_descr: form.formaPagoDescr,
        importe: form.importe,
        no_autorizacion: form.noAutorizacion,
        referencia: form.referencia,
        fecha: "",
        banco_id: form.bancoId,
        banco_descr: form.bancoDescr,
        sat_cta_ori: form.satCtaOri,
        sat_banco_dest: form.satBancoDest,
        sat_banco_dest_descr: form.satBancoDestDescr,
        sat_cta_dest: form.satCtaDest,
        cuentas_cobrar: [
          {
            num_cta_cobrar: form.selectedCuenta!.num_cta_cobrar,
            importe: form.importe,
            moneda_id: form.selectedCuenta!.moneda_id,
            tipo_cambio: form.selectedCuenta!.tipo_cambio,
            documento: form.selectedCuenta!.documento,
            documento_serie: form.selectedCuenta!.documento_serie,
            documento_folio: form.selectedCuenta!.documento_folio,
            tipo_cambio_pago: "",
          },
        ],
      });
      showSuccess(res.msg);
      navigate(`/ingresos/${res.record.serie}/${res.record.folio}`, { replace: true });
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStamp = async () => {
    if (!ingreso) return;
    setSaving(true);
    try {
      const res = await stamp(ingreso.serie, ingreso.folio);
      showSuccess(res.msg);
      setIngreso(res.record);
      form.populateFromIngreso(res.record);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePdf = async () => {
    if (!ingreso) return;
    const filename = `Ingreso-${ingreso.serie}-${ingreso.folio}.pdf`;
    setPdfSheet({ open: true, loading: true, error: null, blob: null, filename });
    try {
      const blob = await printPdf(ingreso.serie, ingreso.folio);
      setPdfSheet(prev => ({ ...prev, loading: false, blob }));
    } catch (err) {
      setPdfSheet(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : String(err) }));
    }
  };

  const handleMailSend = async () => {
    if (!ingreso) return;
    setMailSaving(true);
    try {
      const res = await sendMail(ingreso.serie, ingreso.folio, mailNombre, mailCorreo);
      showSuccess(res.msg);
      setMailSent(true);
      setTimeout(() => { setMailOpen(false); setMailSent(false); }, 1500);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setMailSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!ingreso) return;
    setCancelSaving(true);
    try {
      const res = await cancel(ingreso.serie, ingreso.folio, cancelMotivo);
      showSuccess(res.msg);
      setIngreso(res.record);
      form.populateFromIngreso(res.record);
      setCancelOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setCancelSaving(false);
    }
  };

  const screenState = deriveScreenState(ingreso);
  const readonly = screenState !== "nueva";

  const handleNuevo = () => {
    if (isNew) {
      form.reset();
      setIngreso(null);
      setLoadError(null);
      setMailNombre("");
      setMailCorreo("");
      setCancelMotivo("02");
    } else {
      navigate("/ingresos/nuevo");
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (loadingPage) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 space-y-3">
        <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
        <Button variant="outline" onClick={() => navigate("/ingresos")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const title = isNew ? "Nuevo Ingreso" : `Ingreso ${ingreso?.serie ?? ""}-${ingreso?.folio ?? ""}`;
  const ingresoTitle = ingreso ? `${ingreso.serie}-${ingreso.folio}` : "";

  return (
    <div className="flex flex-col h-full">
      
      {/* TopBar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-10">
        {/* <Button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/ingresos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button> */}
        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/ingresos")}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>
        <button type="button" title="Nuevo ingreso" className="text-muted-foreground hover:text-foreground" onClick={handleNuevo}>
          <FilePlus2 className="h-5 w-5" />
        </button>
        {ingreso && (
          <Badge variant={screenState === "cancelada" ? "destructive" : ingreso.uuid ? "default" : "secondary"}
            className={ingreso.uuid && screenState !== "cancelada" ? "bg-green-600 hover:bg-green-700" : ""}>
            {screenState === "cancelada" ? "Cancelado" : ingreso.uuid ? "Timbrado" : "Registrado"}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto pb-20">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ── CLIENTE ──────────────────────────────────────────────── */}
        <section className="border rounded-lg">
          <div className="bg-primary/70 px-3 py-2 rounded-t-lg">
            <p className="section-heading">Cliente</p>
          </div>
          <div className="p-3 space-y-3">
          {readonly || form.clienteId ? (
            <div className="rounded-lg border p-3 space-y-1 bg-muted/20 relative">
              <p className="text-xs font-mono text-muted-foreground">{form.clienteRfc}</p>
              <p className="font-medium text-sm">{form.clienteNombre}</p>
              {!readonly && (
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={form.clearCliente}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div ref={form.searchContainerRef} className="relative">
              <div className="relative">
                {(form.searching || form.loadingCliente)
                  ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
                <Input
                  className="pl-8"
                  placeholder="Buscar cliente por nombre o RFC…"
                  value={form.searchQuery}
                  onChange={e => form.handleSearchQueryChange(e.target.value)}
                  onFocus={() => form.searchQuery && form.setShowDrop(true)}
                  disabled={form.loadingCliente}
                />
              </div>
              {form.showDrop && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {form.searchResults.length === 0 && !form.searching && (
                    <div className="p-2 text-sm text-muted-foreground">Sin resultados</div>
                  )}
                  {form.searchResults.map(r => (
                    <button key={r.cliente_id} type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => form.handleSearchSelect(r.cliente_id)}>
                      <span className="font-medium">{r.nombre}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">{r.rfc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </section>

        {/* ── FACTURA A APLICAR ─────────────────────────────────────── */}
        <section className="border rounded-lg">
          <div className="bg-primary/70 px-3 py-2 rounded-t-lg">
            <p className="section-heading">Factura a aplicar</p>
          </div>
          <div className="p-3 space-y-3">
          {readonly ? (
            <div className="space-y-2">
              {ingreso?.cuentas_cobrar.records.map(cc => (
                <div key={cc.num_cta_cobrar} className="rounded-lg border p-3 bg-muted/20 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono font-medium">{cc.documento_serie}{cc.documento_folio}</span>
                    <span className="font-mono">{fmt(cc.importe ?? cc.total, cc.moneda_id)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{cc.fecha}</span>
                    <span>TC: {cc.tipo_cambio_pago ?? cc.tipo_cambio}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {form.loadingCuentas && <Skeleton className="h-9 w-full" />}
              {!form.loadingCuentas && form.cuentasCobrar.length === 0 && form.clienteNombre && (
                <p className="text-sm text-muted-foreground">No hay facturas pendientes de pago para este cliente.</p>
              )}
              {!form.loadingCuentas && form.cuentasCobrar.length > 0 && (
                <div className="space-y-1">
                  <Label>Factura</Label>
                  <Select value={form.selectedCuenta?.num_cta_cobrar ?? ""} onValueChange={form.handleCuentaSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar factura…" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.cuentasCobrar.map(cc => (
                        <SelectItem key={cc.num_cta_cobrar} value={cc.num_cta_cobrar}>
                          {cc.documento_serie}{cc.documento_folio} — {cc.moneda_id} {fmt(cc.saldo, cc.moneda_id)} saldo
                          {cc.metodo_pago_sat33 ? ` (${cc.metodo_pago_sat33})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.selectedCuenta && (
                <div className="rounded-lg border p-3 bg-muted/20 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{form.selectedCuenta.documento_serie}{form.selectedCuenta.documento_folio}</span>
                    <span className="font-mono">Total: {fmt(form.selectedCuenta.total, form.selectedCuenta.moneda_id)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{form.selectedCuenta.fecha} · {form.selectedCuenta.metodo_pago_sat33}</span>
                    <span className="font-medium text-foreground">Saldo: {fmt(form.selectedCuenta.saldo, form.selectedCuenta.moneda_id)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </section>

        {/* ── DATOS DEL PAGO ───────────────────────────────────────── */}
        <section className="border rounded-lg">
          <div className="bg-primary/70 px-3 py-2 rounded-t-lg">
            <p className="section-heading">Datos del pago</p>
          </div>
          <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Fecha de pago</Label>
              <DateInput value={form.fechaPagoIso} onChange={form.setFechaPagoIso} disabled={readonly} />
            </div>

            <div className="space-y-1">
              <Label>Forma de pago</Label>
              {readonly ? (
                <Input value={`${form.formaPagoId} – ${form.formaPagoDescr}`} disabled />
              ) : (
                <Select value={form.formaPagoId} onValueChange={v => {
                  form.setFormaPagoId(v);
                  const opt = formaPago.options.find(o => o.value === v);
                  form.setFormaPagoDescr(opt?.label ?? "");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={formaPago.loading ? "Cargando…" : "Seleccionar"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formaPago.options.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.value} – {o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <Label>Moneda</Label>
              <Select value={form.monedaId} onValueChange={v => {
                form.setMonedaId(v);
                if (v === "MXN") form.setTipoCambio("1");
              }} disabled={readonly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN – Peso mexicano</SelectItem>
                  <SelectItem value="USD">USD – Dólar americano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.monedaId !== "MXN" && (
              <div className="space-y-1">
                <Label>Tipo de cambio</Label>
                <Input value={form.tipoCambio} onChange={e => form.setTipoCambio(e.target.value)} disabled={readonly} inputMode="decimal" />
              </div>
            )}

            <div className="space-y-1">
              <Label>Importe</Label>
              <Input value={form.importe} onChange={e => form.setImporte(e.target.value)} disabled={readonly} inputMode="decimal" />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Descripción</Label>
              <Input
                value={readonly ? (ingreso?.descripcion ?? "") : form.descripcion}
                onChange={e => form.setDescripcion(e.target.value)}
                disabled={readonly}
                placeholder="Ej. PAGO DE FACTURA DE VENTA F1532"
              />
            </div>

            <div className="space-y-1">
              <Label>Referencia</Label>
              <Input value={readonly ? (ingreso?.cuentas_cobrar.records[0]?.num_cta_cobrar ?? form.referencia) : form.referencia}
                onChange={e => form.setReferencia(e.target.value)} disabled={readonly} placeholder="Opcional" />
            </div>

            <div className="space-y-1">
              <Label>No. autorización</Label>
              <Input value={form.noAutorizacion} onChange={e => form.setNoAutorizacion(e.target.value)} disabled={readonly} placeholder="Opcional" />
            </div>
          </div>
          </div>
        </section>

        {/* ── DATOS BANCARIOS ──────────────────────────────────────── */}
        <section className="border rounded-lg">
          <div className="bg-primary/70 px-3 py-2 rounded-t-lg">
            <p className="section-heading">Datos bancarios</p>
          </div>
          <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Banco origen (cliente)</Label>
              <div className="flex gap-2">
                <Input className="w-20" placeholder="Clave" value={form.bancoId} onChange={e => form.setBancoId(e.target.value)} disabled={readonly} />
                <Input className="flex-1" placeholder="Nombre del banco" value={form.bancoDescr} onChange={e => form.setBancoDescr(e.target.value)} disabled={readonly} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Cuenta origen (cliente)</Label>
              <Input placeholder="No. de cuenta" value={form.satCtaOri} onChange={e => form.setSatCtaOri(e.target.value)} disabled={readonly} />
            </div>

            <div className="space-y-1">
              <Label>Banco destino (empresa)</Label>
              <div className="flex gap-2">
                <Input className="w-20" placeholder="Clave" value={form.satBancoDest} onChange={e => form.setSatBancoDest(e.target.value)} disabled={readonly} />
                <Input className="flex-1" placeholder="Nombre del banco" value={form.satBancoDestDescr} onChange={e => form.setSatBancoDestDescr(e.target.value)} disabled={readonly} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Cuenta destino (empresa)</Label>
              <Input placeholder="No. de cuenta" value={form.satCtaDest} onChange={e => form.setSatCtaDest(e.target.value)} disabled={readonly} />
            </div>
          </div>
          </div>
        </section>

        {/* UUID (read) */}
        {ingreso?.uuid && (
          <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
            <p className="text-xs text-muted-foreground">UUID</p>
            <p className="font-mono text-xs break-all">{ingreso.uuid}</p>
          </div>
        )}
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ─────────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 border-t bg-background px-4 py-3 flex gap-2 justify-end z-40
                      md:static md:border-t md:px-4 md:py-3 md:bg-transparent max-w-2xl md:mx-auto md:w-full">
        {screenState === "nueva" && (
          <Button className="flex-1 md:flex-none md:min-w-[120px]" onClick={handleGuardar} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Guardando…</> : "Guardar"}
          </Button>
        )}

        {screenState === "cargada" && (
          <Button className="flex-1 md:flex-none md:min-w-[120px]" onClick={handleStamp} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Timbrando…</> : "Timbrar REP"}
          </Button>
        )}

        {screenState === "timbrada" && (
          <>
            <Button variant="outline" onClick={handlePdf}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" onClick={() => { setMailOpen(true); setMailSent(false); }}>
              <Mail className="h-4 w-4 mr-1" /> Correo
            </Button>
            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
              Cancelar
            </Button>
          </>
        )}
      </div>

      <MailDialog
        open={mailOpen}
        onClose={() => setMailOpen(false)}
        title={ingresoTitle}
        nombre={mailNombre}
        onNombreChange={setMailNombre}
        correo={mailCorreo}
        onCorreoChange={setMailCorreo}
        onSend={handleMailSend}
        saving={mailSaving}
        sent={mailSent}
      />

      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={ingresoTitle}
        motivo={cancelMotivo}
        onMotivoChange={setCancelMotivo}
        onConfirm={handleCancel}
        saving={cancelSaving}
      />

      <PdfSheet state={pdfSheet} onClose={() => setPdfSheet(PDF_SHEET_CLOSED)} />
    </div>
  );
}
