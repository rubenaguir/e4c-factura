import type { DraftConcepto, TotalRow, Totales } from "./types";

// ─── Key generator ────────────────────────────────────────────────────────────
// Contador de módulo: genera claves únicas para items del draft (React keys).

let _kseq = 0;
export const newKey = () => String(++_kseq);

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nextMonthISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/** "DD/MM/YYYY[ HH:mm:ss]" → "YYYY-MM-DD" */
export function apiDateToISO(s: string): string {
  if (!s) return "";
  const part = s.split(" ")[0];
  const [d, m, y] = part.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → "DD/MM/YYYY" */
export function isoToApiDate(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

export function fmt(n: number): string {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Cálculos de impuestos (regla crítica: frontend es autoritativo) ──────────

export function calcBase(c: DraftConcepto): number {
  const qty = parseFloat(c.cantidad) || 0;
  const price = parseFloat(c.precio_unitario) || 0;
  const discount = parseFloat(c.descuento) || 0;
  return qty * price - discount;
}

const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Regla SAT: importe por concepto redondeado a 6 decimales.
export function calcImpImporte(base: number, tasa: string, tipoFactor: string): number {
  if (tipoFactor === "Exento") return 0;
  const t = parseFloat(tasa) || 0;
  return round6(base * (t / 100));
}

export function calcTotales(conceptos: DraftConcepto[]): Totales {
  let subtotal = 0;
  const map = new Map<string, TotalRow>();

  for (const c of conceptos) {
    const base = calcBase(c);
    subtotal += base;
    const allImps = [
      ...c.impuestos_traslados.map(i => ({ ...i, aplicacion: "T" })),
      ...c.impuestos_retenciones.map(i => ({ ...i, aplicacion: "R" })),
    ];
    for (const imp of allImps) {
      const k = `${imp.aplicacion}:${imp.impuesto}:${imp.tasa}`;
      const importe = calcImpImporte(base, imp.tasa, imp.tipo_factor);
      const existing = map.get(k);
      // Acumular a 6 decimales para evitar drift de punto flotante entre conceptos.
      if (existing) existing.importe = round6(existing.importe + importe);
      else map.set(k, { aplicacion: imp.aplicacion, impuesto: imp.impuesto, tasa: imp.tasa, importe });
    }
  }

  // Redondear a 2 decimales solo al totalizar, siguiendo la regla del SAT.
  const rows = Array.from(map.values()).map(r => ({ ...r, importe: round2(r.importe) }));
  const traslados = rows.filter(r => r.aplicacion === "T").reduce((s, r) => s + r.importe, 0);
  const retenciones = rows.filter(r => r.aplicacion === "R").reduce((s, r) => s + r.importe, 0);
  return { subtotal: round2(subtotal), rows, total: round2(subtotal + traslados - retenciones) };
}
