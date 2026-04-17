import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void; // emite YYYY-MM-DD
  className?: string;
  disabled?: boolean;
  id?: string;
}

/** Convierte YYYY-MM-DD → DD/MM/YYYY para mostrar */
function toDisplay(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Convierte DD/MM/YYYY → YYYY-MM-DD para emitir */
function toISO(display: string): string {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Input de fecha que siempre muestra DD/MM/YYYY independiente del locale del OS.
 * value/onChange usan formato YYYY-MM-DD (idéntico a <input type="date">).
 * Autoformatea la entrada numérica y abre el native picker mediante un input oculto.
 */
export function DateInput({ value, onChange, className, disabled, id }: DateInputProps) {
  const [text, setText] = useState(() => toDisplay(value));
  const hiddenRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando el prop value cambia externamente
  useEffect(() => {
    setText(toDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Eliminar todo lo que no sea dígito o /
    const raw = e.target.value.replace(/[^\d/]/g, "");

    // Auto-insertar "/" en posición 2 y 5
    const digits = raw.replace(/\//g, "");
    let formatted = "";
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }

    setText(formatted);

    if (formatted.length === 10) {
      const iso = toISO(formatted);
      if (iso) onChange(iso);
    } else if (formatted === "") {
      onChange("");
    }
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value; // YYYY-MM-DD
    onChange(iso);
    setText(toDisplay(iso));
  }

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={text}
        onChange={handleChange}
        disabled={disabled}
        maxLength={10}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "pr-8", // espacio para el icono del picker nativo
          className,
        )}
      />
      {/* Input nativo oculto para abrir el calendar picker */}
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handleNativeChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute right-0 w-8 h-full opacity-0 cursor-pointer"
      />
      {/* Icono calendario visible encima del input oculto */}
      <span
        className="absolute right-2 pointer-events-none text-muted-foreground"
        aria-hidden="true"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 1a.5.5 0 0 1 .5.5V2h5v-.5a.5.5 0 0 1 1 0V2h1.5A1.5 1.5 0 0 1 14 3.5v9A1.5 1.5 0 0 1 12.5 14h-10A1.5 1.5 0 0 1 1 12.5v-9A1.5 1.5 0 0 1 2.5 2H4v-.5a.5.5 0 0 1 .5-.5ZM2 4.5v8A.5.5 0 0 0 2.5 13h10a.5.5 0 0 0 .5-.5v-8H2Zm1-1.5H2.5a.5.5 0 0 0-.5.5V4h11v-.5a.5.5 0 0 0-.5-.5H11v.5a.5.5 0 0 1-1 0V3H5v.5a.5.5 0 0 1-1 0V3Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
        </svg>
      </span>
    </div>
  );
}
