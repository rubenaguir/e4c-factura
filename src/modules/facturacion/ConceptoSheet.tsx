import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineModal } from "./InlineModal";
import { calcBase, calcImpImporte, fmt, newKey } from "./facturaUtils";
import type { DraftConcepto, DraftImpuesto } from "./types";

export interface ConceptoSheetProps {
  concepto: DraftConcepto;
  onSave: (c: DraftConcepto) => void;
  onClose: () => void;
}

export function ConceptoSheet({ concepto, onSave, onClose }: ConceptoSheetProps) {
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
