import type { CuentaCobrar, IngresoDetalle } from "@/api/endpoints/ingresos";
import type { Aplicacion } from "@/hooks/useIngresoForm";
import { needsTipoCambioPago } from "@/hooks/useIngresoForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(val: string, moneda = "MXN") {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${moneda !== "MXN" ? moneda + " " : ""}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Readonly view — facturas aplicadas de un ingreso guardado
// ---------------------------------------------------------------------------

function CuentasReadonly({ ingreso }: { ingreso: IngresoDetalle | null }) {
  const records = ingreso?.cuentas_cobrar.records ?? [];
  return (
    <div className="space-y-2">
      {records.map(cc => (
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
  );
}

// ---------------------------------------------------------------------------
// Editable view — selección múltiple con importe parcial por factura
// ---------------------------------------------------------------------------

interface CuentaRowProps {
  cuenta: CuentaCobrar;
  aplicacion?: Aplicacion;
  monedaPago: string;
  onToggle: (num: string) => void;
  onImporteChange: (num: string, value: string) => void;
  onTipoCambioPagoChange: (num: string, value: string) => void;
}

function CuentaRow({ cuenta, aplicacion, monedaPago, onToggle, onImporteChange, onTipoCambioPagoChange }: CuentaRowProps) {
  const checked = !!aplicacion;
  const ref = `${cuenta.documento_serie}${cuenta.documento_folio}`;
  const showTcPago = checked && needsTipoCambioPago(cuenta.moneda_id, monedaPago);

  return (
    <div className={`rounded-lg border p-3 text-sm space-y-2 ${checked ? "bg-primary/5 border-primary/40" : "bg-muted/10"}`}>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
          checked={checked}
          onChange={() => onToggle(cuenta.num_cta_cobrar)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2">
            <span className="font-mono font-medium">{ref}</span>
            <span className="font-mono text-muted-foreground">Total {fmt(cuenta.total, cuenta.moneda_id)}</span>
          </div>
          <div className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{cuenta.fecha}{cuenta.metodo_pago_sat33 ? ` · ${cuenta.metodo_pago_sat33}` : ""}</span>
            <span className="font-medium text-foreground">Saldo {fmt(cuenta.saldo, cuenta.moneda_id)}</span>
          </div>
        </div>
      </label>

      {checked && (
        <div className="grid grid-cols-2 gap-2 pl-6">
          <div className="space-y-1">
            <Label className="text-xs">Importe ({monedaPago})</Label>
            <Input
              inputMode="decimal"
              value={aplicacion.importe}
              onChange={e => onImporteChange(cuenta.num_cta_cobrar, e.target.value)}
            />
          </div>
          {showTcPago && (
            <div className="space-y-1">
              <Label className="text-xs">TC pago ({cuenta.moneda_id})</Label>
              <Input
                inputMode="decimal"
                placeholder="Requerido"
                value={aplicacion.tipoCambioPago}
                onChange={e => onTipoCambioPagoChange(cuenta.num_cta_cobrar, e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CuentasAplicarSectionProps {
  readonly: boolean;
  ingreso: IngresoDetalle | null;
  cuentasCobrar: CuentaCobrar[];
  aplicaciones: Record<string, Aplicacion>;
  monedaPago: string;
  importeTotal: string;
  loadingCuentas: boolean;
  clienteNombre: string;
  onToggle: (num: string) => void;
  onImporteChange: (num: string, value: string) => void;
  onTipoCambioPagoChange: (num: string, value: string) => void;
}

export function CuentasAplicarSection(props: CuentasAplicarSectionProps) {
  const {
    readonly, ingreso, cuentasCobrar, aplicaciones, monedaPago, importeTotal,
    loadingCuentas, clienteNombre, onToggle, onImporteChange, onTipoCambioPagoChange,
  } = props;

  const seleccionadas = Object.keys(aplicaciones).length;

  return (
    <section className="border rounded-lg">
      <div className="bg-primary/70 px-3 py-2 rounded-t-lg flex items-center justify-between">
        <p className="section-heading">Facturas a aplicar</p>
        {!readonly && seleccionadas > 0 && (
          <span className="text-xs text-primary-foreground/90">{seleccionadas} seleccionada(s)</span>
        )}
      </div>
      <div className="p-3 space-y-3">
        {readonly ? (
          <CuentasReadonly ingreso={ingreso} />
        ) : (
          <div className="space-y-2">
            {loadingCuentas && <Skeleton className="h-9 w-full" />}
            {!loadingCuentas && cuentasCobrar.length === 0 && clienteNombre && (
              <p className="text-sm text-muted-foreground">No hay facturas pendientes de pago para este cliente.</p>
            )}
            {!loadingCuentas && cuentasCobrar.length === 0 && !clienteNombre && (
              <p className="text-sm text-muted-foreground">Selecciona un cliente para ver sus facturas pendientes.</p>
            )}
            {cuentasCobrar.map(cc => (
              <CuentaRow
                key={cc.num_cta_cobrar}
                cuenta={cc}
                aplicacion={aplicaciones[cc.num_cta_cobrar]}
                monedaPago={monedaPago}
                onToggle={onToggle}
                onImporteChange={onImporteChange}
                onTipoCambioPagoChange={onTipoCambioPagoChange}
              />
            ))}
            {cuentasCobrar.length > 0 && (
              <div className="flex justify-between items-center border-t pt-2 mt-2 text-sm font-medium">
                <span>Total a aplicar</span>
                <span className="font-mono">{fmt(importeTotal, monedaPago)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
