import type { AntiguedadSaldosResponse, CancelacionPendiente } from "@/api/endpoints/dashboard";

const CACHE_KEY = "e4c_dashboard";
const TTL_MS = 10 * 60 * 1000;

export type AntiguedadSaldosData = Omit<AntiguedadSaldosResponse, "success">;

export interface DashboardCache {
  facturado: { mes_actual: string; mes_anterior: string };
  porCobrar: { mes_actual: string; mes_anterior: string };
  ingresos: { mes_actual: string; mes_anterior: string };
  antiguedadSaldos: AntiguedadSaldosData;
  cancelaciones: CancelacionPendiente[];
  fetchedAt: string;
}

export function readCache(): DashboardCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardCache;
  } catch {
    return null;
  }
}

export function writeCache(data: Omit<DashboardCache, "fetchedAt">): void {
  const cache: DashboardCache = { ...data, fetchedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage lleno — ignorar
  }
}

export function isCacheStale(cache: DashboardCache): boolean {
  return Date.now() - new Date(cache.fetchedAt).getTime() >= TTL_MS;
}
