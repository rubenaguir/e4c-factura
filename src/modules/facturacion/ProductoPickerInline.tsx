import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { validateSku, searchSkuForFactura } from "@/api/endpoints/facturas";
import { addProducto } from "@/api/endpoints/productos";
import type { SkuLov } from "@/api/endpoints/facturas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnackbar } from "@/context/useSnackbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineModal } from "./InlineModal";
import { conceptoFromSku } from "./facturaMappers";
import type { DraftConcepto } from "./types";

export interface ProductoPickerInlineProps {
  listaPreciosId: string;
  monedaId: string;
  tipoCambio: string;
  onAdd: (concepto: DraftConcepto) => void;
}

export interface ProductoPickerInlineHandle {
  openAdd: () => void;
}

export const ProductoPickerInline = forwardRef<ProductoPickerInlineHandle, ProductoPickerInlineProps>(
function ProductoPickerInline({ listaPreciosId, monedaId, tipoCambio, onAdd }: ProductoPickerInlineProps, ref) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkuLov[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    sku: "", descripcion: "", unidad_id: "PZ",
    clave_prod_ser_sat: "", almacenable: "S", esquema_impuestos_id: "GENERAL",
  });
  const { showError } = useSnackbar();
  const [addSaving, setAddSaving] = useState(false);
  const debRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ openAdd: () => setAddOpen(true) }));

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      if (q.trim()) {
        try {
          const exact = await validateSku(q.trim(), listaPreciosId);
          setResults([exact]);
          setShowDrop(true);
          return;
        } catch { /* sin coincidencia exacta, continuar */ }
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
      showError("SKU, descripción, unidad y clave SAT son requeridos"); return;
    }
    setAddSaving(true);
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
      const skuLov = await validateSku(addForm.sku, listaPreciosId);
      onAdd(conceptoFromSku(skuLov, monedaId, tipoCambio));
      setAddOpen(false);
      setAddForm({ sku: "", descripcion: "", unidad_id: "PZ", clave_prod_ser_sat: "", almacenable: "S", esquema_impuestos_id: "GENERAL" });
      setQuery(""); setShowDrop(false);
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
      <InlineModal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo producto">
        <div className="space-y-3">
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
