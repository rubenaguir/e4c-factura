import type { CancelacionPendiente } from "@/api/endpoints/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  console.log(y);
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

function EstatusBadge({ estatus }: { estatus: string }) {
  if (estatus === "Plazo vencido") {
    return <Badge variant="destructive">{estatus}</Badge>;
  }
  return (
    <Badge className="border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
      {estatus}
    </Badge>
  );
}

export interface CancelacionesListProps {
  items: CancelacionPendiente[] | null;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  onRetry: () => void;
}

export default function CancelacionesList({
  items,
  status,
  error,
  onRetry,
}: CancelacionesListProps) {
  const count = items?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Cancelaciones pendientes{status === "success" && count > 0 ? ` (${count})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" || status === "idle" ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : status === "error" ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error ?? "Error desconocido"}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin cancelaciones pendientes</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={`${item.serie}-${item.folio}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      {item.serie}-{item.folio}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.receptor_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {mxn.format(parseFloat(item.total))} · {formatFecha(item.fecha)}
                    </p>
                  </div>
                  <EstatusBadge estatus={item.estatus_cancelacion} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
