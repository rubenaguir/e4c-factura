import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Mail,
  Eye,
} from "lucide-react";
import { useFacturas } from "@/context/FacturasContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FacturaRow } from "@/api/endpoints/facturas";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function minus30dIso() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → DD/MM/YYYY */
function toApiDate(isoDate: string) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function estatusBadge(row: FacturaRow) {
  if (row.estatus === "C")
    return <Badge variant="destructive">Cancelada</Badge>;
  if (row.estatus === "R") {
    if (row.cancelacion_estatus === "En proceso")
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Cancel. pendiente</Badge>;
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Timbrada</Badge>;
  }
  return <Badge variant="secondary">Prefactura</Badge>;
}

function fmtCurrency(value: string, moneda: string) {
  const n = parseFloat(value);
  if (isNaN(n)) return value;
  return `${moneda !== "MXN" ? moneda + " " : ""}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Send-mail dialog state
// ---------------------------------------------------------------------------

interface MailDialogState {
  open: boolean;
  factura: FacturaRow | null;
  nombre: string;
  correo: string;
  asunto: string;
  loading: boolean;
  sent: boolean;
  error: string | null;
}

const MAIL_CLOSED: MailDialogState = {
  open: false,
  factura: null,
  nombre: "",
  correo: "",
  asunto: "",
  loading: false,
  sent: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FacturasPage() {
  const navigate = useNavigate();
  const { state, pageSize, search, sendMail, printPdf } = useFacturas();
  const { list, totalCount, loading, error, stale, page } = state;
  const { empresaId } = useAuth();

  // Filters
  const [fechaIni, setFechaIni] = useState(minus30dIso);
  const [fechaFin, setFechaFin] = useState(todayIso);
  const [rfc, setRfc] = useState("");
  const [nombre, setNombre] = useState("");
  const [serie, setSerie] = useState("");
  const [folio, setFolio] = useState("");
  const [estatus, setEstatus] = useState("*");

  // Actions
  const [pdfLoading, setPdfLoading] = useState<string | null>(null); // "serie-folio"
  const [mail, setMail] = useState<MailDialogState>(MAIL_CLOSED);

  // Initial load / stale reload
  useEffect(() => {
    if (stale) {
      search(
        {
          fecha_inicial: toApiDate(fechaIni),
          fecha_final: toApiDate(fechaFin),
          rfc,
          nombre,
          serie,
          folio,
          estatus: estatus === "*" ? "" : estatus,
        },
        0
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale]);

  const handleSearch = (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    search(
      {
        fecha_inicial: toApiDate(fechaIni),
        fecha_final: toApiDate(fechaFin),
        rfc,
        nombre,
        serie,
        folio,
        estatus: estatus === "*" ? "" : estatus,
      },
      0,
      true
    );
  };

  const handleRowClick = (row: FacturaRow) => {
    navigate(`/facturas/${row.serie}/${row.folio}`);
  };

  const handlePdf = async (e: React.MouseEvent, row: FacturaRow) => {
    e.stopPropagation();
    const key = `${row.serie}-${row.folio}`;
    setPdfLoading(key);
    try {
      const dataUrl = await printPdf(empresaId ?? "", row.serie, row.folio, "");
      window.open(dataUrl, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setPdfLoading(null);
    }
  };

  const handleMailOpen = (e: React.MouseEvent, row: FacturaRow) => {
    e.stopPropagation();
    setMail({
      open: true,
      factura: row,
      nombre: row.receptor_nombre,
      correo: "",
      asunto: `Factura ${row.serie}-${row.folio}`,
      loading: false,
      sent: false,
      error: null,
    });
  };

  const handleMailSend = async () => {
    if (!mail.factura) return;
    setMail((m) => ({ ...m, loading: true, error: null }));
    try {
      const res = await sendMail(
        mail.factura.serie,
        mail.factura.folio,
        mail.nombre,
        mail.correo,
        mail.asunto
      );
      setMail((m) => ({ ...m, loading: false, sent: true, error: null }));
      setTimeout(() => setMail(MAIL_CLOSED), 1500);
      void res;
    } catch (err) {
      setMail((m) => ({
        ...m,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const activeFilters = {
    fecha_inicial: toApiDate(fechaIni),
    fecha_final: toApiDate(fechaFin),
    rfc,
    nombre,
    serie,
    folio,
    estatus: estatus === "*" ? "" : estatus,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Facturas</h1>
        <Button size="sm" onClick={() => navigate("/facturas/nuevo")}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-2 px-4 py-3 border-b bg-muted/30"
      >
        <div className="flex gap-1 items-center">
          <DateInput
            className="h-9 text-sm w-36"
            value={fechaIni}
            onChange={setFechaIni}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <DateInput
            className="h-9 text-sm w-36"
            value={fechaFin}
            onChange={setFechaFin}
          />
        </div>

        <Input
          placeholder="RFC"
          className="w-32 h-9 text-sm uppercase"
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
        />
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nombre receptor"
            className="pl-8 h-9 text-sm"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <Input
          placeholder="Serie"
          className="w-20 h-9 text-sm"
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
        />
        <Input
          placeholder="Folio"
          className="w-24 h-9 text-sm"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
        />
        <Select value={estatus} onValueChange={setEstatus}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="*">Todos</SelectItem>
            <SelectItem value="P">Prefactura</SelectItem>
            <SelectItem value="R">Timbradas</SelectItem>
            <SelectItem value="C">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={loading} className="h-9">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-1 hidden sm:inline">Buscar</span>
        </Button>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Serie/Folio</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">RFC</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nombre</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Estatus</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-7 w-20" /></td>
                  </tr>
                ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                list.map((row) => {
                  const key = `${row.serie}-${row.folio}`;
                  return (
                    <tr
                      key={key}
                      onClick={() => handleRowClick(row)}
                      className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2 text-muted-foreground">{row.fecha}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {row.serie}-{row.folio}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{row.receptor_rfc}</td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{row.receptor_nombre}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {fmtCurrency(row.total, row.moneda_id)}
                      </td>
                      <td className="px-4 py-2">{estatusBadge(row)}</td>
                      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Ver detalle"
                            onClick={() => handleRowClick(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {row.estatus !== "P" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Descargar PDF"
                              disabled={pdfLoading === key}
                              onClick={(e) => handlePdf(e, row)}
                            >
                              {pdfLoading === key ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {row.estatus === "R" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Enviar por correo"
                              onClick={(e) => handleMailOpen(e, row)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          {!loading && list.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados
            </p>
          )}
          {!loading &&
            list.map((row) => {
              const key = `${row.serie}-${row.folio}`;
              return (
                <div
                  key={key}
                  className="px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => handleRowClick(row)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{row.receptor_nombre}</p>
                        <p className="text-xs text-muted-foreground font-mono">{row.receptor_rfc}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {row.fecha} · {row.serie}-{row.folio}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-mono font-medium">
                          {fmtCurrency(row.total, row.moneda_id)}
                        </p>
                        <div className="mt-1">{estatusBadge(row)}</div>
                      </div>
                    </div>
                  </button>
                  {/* Action row */}
                  <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleRowClick(row)}
                    >
                      <Eye className="h-3 w-3" /> Ver
                    </Button>
                    {row.estatus !== "P" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={pdfLoading === key}
                        onClick={(e) => handlePdf(e, row)}
                      >
                        {pdfLoading === key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}{" "}
                        PDF
                      </Button>
                    )}
                    {row.estatus === "R" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => handleMailOpen(e, row)}
                      >
                        <Mail className="h-3 w-3" /> Correo
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-background text-sm">
          <span className="text-muted-foreground">
            {totalCount} factura{totalCount !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Página ${page + 1} de ${totalPages}`}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => search(activeFilters, page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext || loading}
              onClick={() => search(activeFilters, page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Send-mail dialog */}
      <Dialog
        open={mail.open}
        onOpenChange={(open) => !open && setMail(MAIL_CLOSED)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Enviar factura {mail.factura?.serie}-{mail.factura?.folio}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {mail.sent && (
              <p className="text-sm text-green-600 font-medium">Correo enviado.</p>
            )}
            {mail.error && (
              <Alert variant="destructive">
                <AlertDescription>{mail.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="mail-nombre">Nombre</Label>
              <Input
                id="mail-nombre"
                value={mail.nombre}
                onChange={(e) => setMail((m) => ({ ...m, nombre: e.target.value }))}
                disabled={mail.loading || mail.sent}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mail-correo">Correo electrónico</Label>
              <Input
                id="mail-correo"
                type="email"
                value={mail.correo}
                onChange={(e) => setMail((m) => ({ ...m, correo: e.target.value }))}
                disabled={mail.loading || mail.sent}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mail-asunto">Asunto</Label>
              <Input
                id="mail-asunto"
                value={mail.asunto}
                onChange={(e) => setMail((m) => ({ ...m, asunto: e.target.value }))}
                disabled={mail.loading || mail.sent}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMail(MAIL_CLOSED)}
              disabled={mail.loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMailSend}
              disabled={mail.loading || mail.sent || !mail.correo}
            >
              {mail.loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Enviando…</>
              ) : (
                "Enviar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
