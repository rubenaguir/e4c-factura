import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PASOS = [
  { numero: 1, etiqueta: "Datos fiscales" },
  { numero: 2, etiqueta: "Cuenta" },
  { numero: 3, etiqueta: "Verificación" },
] as const;

interface RegistroProgressProps {
  paso: 1 | 2 | 3;
}

/** Indicador 1/2/3 del wizard de registro (§14). */
export default function RegistroProgress({ paso }: RegistroProgressProps) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Paso ${paso} de 3`}>
      {PASOS.map((p, idx) => {
        const completado = p.numero < paso;
        const actual = p.numero === paso;
        return (
          <li key={p.numero} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-current={actual ? "step" : undefined}
                className={cn(
                  "h-6 w-6 shrink-0 rounded-full border text-xs font-medium flex items-center justify-center",
                  completado && "bg-primary border-primary text-primary-foreground",
                  actual && "border-primary text-primary",
                  !completado && !actual && "border-border text-muted-foreground"
                )}
              >
                {completado ? <Check className="h-3.5 w-3.5" /> : p.numero}
              </span>
              <span
                className={cn(
                  "text-xs truncate hidden sm:inline",
                  actual ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {p.etiqueta}
              </span>
            </div>
            {idx < PASOS.length - 1 && (
              <span
                className={cn("h-px flex-1 min-w-3", completado ? "bg-primary" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
