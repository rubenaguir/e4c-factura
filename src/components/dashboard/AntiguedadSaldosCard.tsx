import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AntiguedadSaldosData } from "@/lib/dashboardCache";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fmt = (v: string) => mxn.format(parseFloat(v));

const RANGOS: { key: keyof Omit<AntiguedadSaldosData, "saldo_total">; label: string; color: string }[] = [
  { key: "saldo_0",     label: "Al corriente", color: "bg-gray-400" },
  { key: "saldo_1_30",  label: "1–30 días",    color: "bg-yellow-400" },
  { key: "saldo_31_60", label: "31–60 días",   color: "bg-orange-400" },
  { key: "saldo_61_90", label: "61–90 días",   color: "bg-red-300" },
  { key: "saldo_91",    label: "+90 días",     color: "bg-red-600" },
];

interface Props {
  data: AntiguedadSaldosData | null;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  onRetry: () => void;
}

export default function AntiguedadSaldosCard({ data, status, error, onRetry }: Props) {
  const total = data ? parseFloat(data.saldo_total) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Antigüedad de saldos</CardTitle>
        {status === "success" && data && (
          <p className="text-2xl font-bold">{fmt(data.saldo_total)}</p>
        )}
      </CardHeader>
      <CardContent>
        {status === "loading" || status === "idle" ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : status === "error" ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error ?? "Error desconocido"}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>
          </div>
        ) : data && total > 0 ? (
          <div className="space-y-3">
            {RANGOS.filter((r) => parseFloat(data[r.key]) > 0).map((r) => {
              const value = parseFloat(data[r.key]);
              const pct = Math.max((value / total) * 100, 2);
              return (
                <div key={r.key}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{r.label}</span>
                    <span>{fmt(data[r.key])}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className={`${r.color} h-2.5 rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin saldos pendientes</p>
        )}
      </CardContent>
    </Card>
  );
}
