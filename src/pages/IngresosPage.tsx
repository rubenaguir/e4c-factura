import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Loader2, FileText, Mail, Eye,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useIngresos } from "@/context/IngresosContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PdfSheet } from "@/modules/facturacion/PdfSheet";
import { PDF_SHEET_CLOSED, type PdfSheetState } from "@/modules/facturacion/pdfSheetState";
import { useSnackbar } from "@/context/useSnackbar";
import type { IngresoRow } from "@/api/endpoints/ingresos";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayIso() { return new Date().toISOString().slice(0, 10); }
function minus30dIso() {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
}
function toApiDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtImporte(val: string, moneda: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${moneda !== "MXN" ? moneda + " " : ""}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function estatusBadge(row: IngresoRow) {
  if (row.estatus === "C")
    return <Badge variant="destructive">Cancelado</Badge>;
  if (row.uuid)
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Timbrado</Badge>;
  return <Badge variant="secondary">Registrado</Badge>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IngresosPage() {
  const navigate = useNavigate();
  const { state, pageSize, search, sendMail, printPdf } = useIngresos();
  const { list, totalCount, loading, error, stale, page } = state;
  const { showError } = useSnackbar();

  const [fechaIni, setFechaIni] = useState(minus30dIso);
  const [fechaFin, setFechaFin] = useState(todayIso);
  const [rfc, setRfc] = useState("");
  const [nombre, setNombre] = useState("");
  const [factSerieFolio, setFactSerieFolio] = useState("");
  const [estatus, setEstatus] = useState("*");

  const [pdfSheet, setPdfSheet] = useState<PdfSheetState>(PDF_SHEET_CLOSED);

  interface MailState {
    open: boolean; row: IngresoRow | null; nombre: string; correo: string; loading: boolean; sent: boolean;
  }
  const MAIL_CLOSED: MailState = { open: false, row: null, nombre: "", correo: "", loading: false, sent: false };
  const [mail, setMail] = useState<MailState>(MAIL_CLOSED);

  useEffect(() => { if (error) showError(error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stale) {
      search({
        fecha_inicial_pago: toApiDate(fechaIni),
        fecha_final_pago: toApiDate(fechaFin),
        rfc, nombre, fact_serie_folio: factSerieFolio,
        estatus: estatus === "*" ? "" : estatus,
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale]);

  const activeFilters = {
    fecha_inicial_pago: toApiDate(fechaIni),
    fecha_final_pago: toApiDate(fechaFin),
    rfc, nombre, fact_serie_folio: factSerieFolio,
    estatus: estatus === "*" ? "" : estatus,
  };

  const handleSearch = (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    search(activeFilters, 0, true);
  };

  const handlePdf = async (e: React.MouseEvent, row: IngresoRow) => {
    e.stopPropagation();
    const filename = `Ingreso-${row.serie}-${row.folio}.pdf`;
    setPdfSheet({ open: true, loading: true, error: null, blob: null, filename });
    try {
      const blob = await printPdf(row.serie, row.folio);
      setPdfSheet(prev => ({ ...prev, loading: false, blob }));
    } catch (err) {
      setPdfSheet(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : String(err) }));
    }
  };

  const handleMailSend = async () => {
    if (!mail.row) return;
    setMail(m => ({ ...m, loading: true }));
    try {
      await sendMail(mail.row.serie, mail.row.folio, mail.nombre, mail.correo);
      setMail(m => ({ ...m, loading: false, sent: true }));
      setTimeout(() => setMail(MAIL_CLOSED), 1500);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
      setMail(m => ({ ...m, loading: false }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Ingresos / Pagos</h1>
        <Button size="sm" onClick={() => navigate("/ingresos/nuevo")}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 px-4 py-3 border-b bg-muted/30">
        <div className="space-y-0.5">
          <Label className="text-xs text-muted-foreground">Fecha pago</Label>
          <div className="flex gap-1 items-center">
            <DateInput className="h-9 text-sm w-36" value={fechaIni} onChange={setFechaIni} />
            <span className="text-muted-foreground text-sm">–</span>
            <DateInput className="h-9 text-sm w-36" value={fechaFin} onChange={setFechaFin} />
          </div>
        </div>
        <Input
          placeholder="RFC"
          className="w-32 h-9 text-sm uppercase"
          value={rfc}
          onChange={e => setRfc(e.target.value.toUpperCase())}
        />
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nombre"
            className="pl-8 h-9 text-sm"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>
        <Input
          placeholder="Serie/Folio factura"
          className="w-36 h-9 text-sm"
          value={factSerieFolio}
          onChange={e => setFactSerieFolio(e.target.value)}
        />
        <Select value={estatus} onValueChange={setEstatus}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="*">Todos</SelectItem>
            <SelectItem value="R">Registrados</SelectItem>
            <SelectItem value="C">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={loading} className="h-9">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-1 hidden sm:inline">Buscar</span>
        </Button>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-primary/70 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-white">Fecha pago</th>
                <th className="text-left px-4 py-2 font-medium text-white">IN-Folio</th>
                <th className="text-left px-4 py-2 font-medium text-white">RFC</th>
                <th className="text-left px-4 py-2 font-medium text-white">Nombre</th>
                <th className="text-left px-4 py-2 font-medium text-white">Factura(s)</th>
                <th className="text-right px-4 py-2 font-medium text-white">Importe</th>
                <th className="text-left px-4 py-2 font-medium text-white">Estatus</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-7 w-20" /></td>
                </tr>
              ))}
              {!loading && list.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
              {!loading && list.map((row, i) => (
                <tr
                  key={`${row.serie}-${row.folio}`}
                  onClick={() => navigate(`/ingresos/${row.serie}/${row.folio}`)}
                  className={["border-b cursor-pointer transition-colors hover:bg-primary/8", i % 2 === 1 ? "bg-muted/20" : ""].join(" ")}
                >
                  <td className="px-4 py-2 text-muted-foreground">{row.fecha_pago}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.serie}-{row.folio}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.rfc}</td>
                  <td className="px-4 py-2 max-w-[180px] truncate">{row.nombre}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[160px] truncate">{row.fact_serie_folio}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmtImporte(row.importe, row.moneda_id)}</td>
                  <td className="px-4 py-2">{estatusBadge(row)}</td>
                  <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Ver"
                        onClick={() => navigate(`/ingresos/${row.serie}/${row.folio}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {row.uuid && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="PDF"
                          disabled={pdfSheet.loading} onClick={e => handlePdf(e, row)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {row.uuid && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Correo"
                          onClick={e => { e.stopPropagation(); setMail({ open: true, row, nombre: row.nombre, correo: "", loading: false, sent: false }); }}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-1.5">
              <Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-20" />
            </div>
          ))}
          {!loading && list.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin resultados</p>
          )}
          {!loading && list.map((row, i) => (
            <div
              key={`${row.serie}-${row.folio}`}
              className={["px-4 py-3 transition-colors", i % 2 === 1 ? "bg-muted/20" : ""].join(" ")}
            >
              <button type="button" className="w-full text-left" onClick={() => navigate(`/ingresos/${row.serie}/${row.folio}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{row.nombre}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.rfc}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.fecha_pago} · {row.serie}-{row.folio}</p>
                    {row.fact_serie_folio && (
                      <p className="text-xs text-muted-foreground truncate">{row.fact_serie_folio}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-mono font-medium">{fmtImporte(row.importe, row.moneda_id)}</p>
                    <div className="mt-1">{estatusBadge(row)}</div>
                  </div>
                </div>
              </button>
              <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => navigate(`/ingresos/${row.serie}/${row.folio}`)}>
                  <Eye className="h-3 w-3" /> Ver
                </Button>
                {row.uuid && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                    disabled={pdfSheet.loading} onClick={e => handlePdf(e, row)}>
                    <FileText className="h-3 w-3" /> PDF
                  </Button>
                )}
                {row.uuid && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                    onClick={() => setMail({ open: true, row, nombre: row.nombre, correo: "", loading: false, sent: false })}>
                    <Mail className="h-3 w-3" /> Correo
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-background text-sm">
          <span className="text-muted-foreground">
            {totalCount} ingreso{totalCount !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Página ${page + 1} de ${totalPages}`}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => search(activeFilters, page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => search(activeFilters, page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF sheet */}
      <PdfSheet state={pdfSheet} onClose={() => setPdfSheet(PDF_SHEET_CLOSED)} />

      {/* Mail dialog */}
      <Dialog open={mail.open} onOpenChange={open => !open && setMail(MAIL_CLOSED)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar ingreso {mail.row?.serie}-{mail.row?.folio}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {mail.sent && <p className="text-sm text-green-600 font-medium">Correo enviado.</p>}
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={mail.nombre} onChange={e => setMail(m => ({ ...m, nombre: e.target.value }))} disabled={mail.loading || mail.sent} />
            </div>
            <div className="space-y-1">
              <Label>Correo electrónico</Label>
              <Input type="email" value={mail.correo} onChange={e => setMail(m => ({ ...m, correo: e.target.value }))} disabled={mail.loading || mail.sent} placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMail(MAIL_CLOSED)} disabled={mail.loading}>Cancelar</Button>
            <Button onClick={handleMailSend} disabled={mail.loading || mail.sent || !mail.correo}>
              {mail.loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Enviando…</> : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
