import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { useFacturas } from "@/context/FacturasContext";
import { searchClientesForFactura, validateLovFieldClientes } from "@/api/endpoints/facturas";
import { addCliente } from "@/api/endpoints/clientes";
import type { ClienteLov, FacturaCompleta } from "@/api/endpoints/facturas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnackbar } from "@/context/useSnackbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineModal } from "./InlineModal";

const EMPTY_CLIENT_LOV: ClienteLov = {
  cliente_id: "", nombre: "", rfc: "",
  calle: null, no_exterior: null, no_interior: null, colonia: null,
  localidad: null, referencia: null, municipio: null, estado: null,
  pais: "MEX", codigo_postal: null,
  metodo_de_pago: null, metodo_de_pago_descr: null,
  lista_precios_id: "", vendedor_id: null, vendedor_nombre: null,
  num_cta_pago: null, dias_credito: "0", limite_credito: "0",
  fecha_vencimiento: "", estatus: "A", regimen_fiscal_id: "",
  empresa_id: "", corporativo_id: "",
};

export interface ClientePickerInlineProps {
  clienteId: string;
  receptorNombre: string;
  receptorRfc: string;
  readonly: boolean;
  onSelect: (client: ClienteLov) => void;
  onPresetLoaded: (f: FacturaCompleta) => void;
  regimenFiscalOptions: { value: string; label: string }[];
}

export interface ClientePickerInlineHandle {
  openAdd: () => void;
}

export const ClientePickerInline = forwardRef<ClientePickerInlineHandle, ClientePickerInlineProps>(
function ClientePickerInline({
  clienteId, receptorNombre, receptorRfc, readonly,
  onSelect, onPresetLoaded, regimenFiscalOptions,
}: ClientePickerInlineProps, ref) {
  const { loadPresetClientData } = useFacturas();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ cliente_id: string; nombre: string; rfc: string }>>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: "", rfc: "", codigo_postal: "", regimen_fiscal_id: "" });
  const { showError } = useSnackbar();
  const [addSaving, setAddSaving] = useState(false);
  const debRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ openAdd: () => setAddOpen(true) }));

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
    } catch { /* ignorar */ }
  };

  const handleInlineAdd = async () => {
    if (!addForm.nombre || !addForm.rfc || !addForm.codigo_postal || !addForm.regimen_fiscal_id) {
      showError("Todos los campos marcados con * son requeridos"); return;
    }
    setAddSaving(true);
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
      showError(e instanceof Error ? e.message : String(e));
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

  if (readonly || clienteId) {
    return (
      <div className="rounded-lg border p-3 space-y-1 bg-muted/20">
        <p className="text-xs font-mono text-muted-foreground">{receptorRfc}</p>
        <p className="font-medium text-sm">{receptorNombre}</p>
        {!readonly && (
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 mt-1"
            onClick={() => onSelect(EMPTY_CLIENT_LOV)}>
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
      <InlineModal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo cliente">
        <div className="space-y-3">
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
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)} disabled={addSaving}>Cancelar</Button>
            <Button className="flex-1" onClick={handleInlineAdd} disabled={addSaving}>
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Guardar
            </Button>
          </div>
        </div>
      </InlineModal>
    </div>
  );
});
