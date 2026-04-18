import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function formatMXN(value: string): string {
  return mxn.format(parseFloat(value));
}

function Delta({ mesActual, mesAnterior }: { mesActual: string; mesAnterior: string }) {
  const actual = parseFloat(mesActual);
  const anterior = parseFloat(mesAnterior);
  if (anterior === 0) return null;
  const pct = ((actual - anterior) / anterior) * 100;
  if (pct === 0) return <span className="text-sm text-muted-foreground">= 0% vs mes anterior</span>;
  const positive = pct > 0;
  return (
    <span className={`text-sm font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% vs mes anterior
    </span>
  );
}

export interface MetricCardProps {
  label: string;
  mesActual: string | null;
  mesAnterior: string | null;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  onRetry: () => void;
}

export default function MetricCard({
  label,
  mesActual,
  mesAnterior,
  status,
  error,
  onRetry,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" || status === "idle" ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : status === "error" ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error ?? "Error desconocido"}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl font-bold">{mesActual ? formatMXN(mesActual) : "—"}</p>
            {mesActual && mesAnterior && (
              <Delta mesActual={mesActual} mesAnterior={mesAnterior} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
