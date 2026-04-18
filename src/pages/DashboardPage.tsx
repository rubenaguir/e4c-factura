import { useEffect, useRef, useState } from "react";
import type { CancelacionPendiente } from "@/api/endpoints/dashboard";
import {
  getMontoFacturado,
  getPorCobrar,
  getIngresos,
  getCancelacionesPendientes,
} from "@/api/endpoints/dashboard";
import { readCache, writeCache, isCacheStale } from "@/lib/dashboardCache";
import MetricCard from "@/components/dashboard/MetricCard";
import CancelacionesList from "@/components/dashboard/CancelacionesList";

type Status = "idle" | "loading" | "success" | "error";

interface CardState<T> {
  status: Status;
  data: T | null;
  error: string | null;
}

type FacturadoData = { mes_actual: string; mes_anterior: string };
type PorCobrarData = { total: string };
type IngresosData = { mes_actual: string; mes_anterior: string };
type CancelacionesData = CancelacionPendiente[];

interface DashboardState {
  facturado: CardState<FacturadoData>;
  porCobrar: CardState<PorCobrarData>;
  ingresos: CardState<IngresosData>;
  cancelaciones: CardState<CancelacionesData>;
}

const LOADING: CardState<never> = { status: "loading", data: null, error: null };

function cardFromCache<T>(data: T): CardState<T> {
  return { status: "success", data, error: null };
}

function stateFromCache(cache: NonNullable<ReturnType<typeof readCache>>): DashboardState {
  return {
    facturado: cardFromCache(cache.facturado),
    porCobrar: cardFromCache(cache.porCobrar),
    ingresos: cardFromCache(cache.ingresos),
    cancelaciones: cardFromCache(cache.cancelaciones),
  };
}

const INITIAL_STATE: DashboardState = {
  facturado: LOADING,
  porCobrar: LOADING,
  ingresos: LOADING,
  cancelaciones: LOADING,
};

function buildPeriodLabels() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", opts).format(d);
  const mesActualLabel = fmt(now, { month: "long", year: "numeric" });
  const mesAnteriorLabel = fmt(prev, { month: "long" });
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    mesActualLabel: capitalize(mesActualLabel),
    mesAnteriorLabel: capitalize(mesAnteriorLabel),
  };
}

const { mesActualLabel, mesAnteriorLabel } = buildPeriodLabels();

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(() => {
    const cache = readCache();
    if (cache) return stateFromCache(cache);
    return INITIAL_STATE;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchAll = async () => {
    setState((prev) => ({
      facturado: prev.facturado.status === "success" ? prev.facturado : LOADING,
      porCobrar: prev.porCobrar.status === "success" ? prev.porCobrar : LOADING,
      ingresos: prev.ingresos.status === "success" ? prev.ingresos : LOADING,
      cancelaciones: prev.cancelaciones.status === "success" ? prev.cancelaciones : LOADING,
    }));

    const [r1, r2, r3, r4] = await Promise.allSettled([
      getMontoFacturado(),
      getPorCobrar(),
      getIngresos(),
      getCancelacionesPendientes(),
    ]);

    const next: DashboardState = { ...stateRef.current };

    if (r1.status === "fulfilled") {
      next.facturado = { status: "success", data: { mes_actual: r1.value.mes_actual, mes_anterior: r1.value.mes_anterior }, error: null };
    } else {
      next.facturado = { status: "error", data: null, error: String(r1.reason?.message ?? "Error desconocido") };
    }

    if (r2.status === "fulfilled") {
      next.porCobrar = { status: "success", data: { total: r2.value.total }, error: null };
    } else {
      next.porCobrar = { status: "error", data: null, error: String(r2.reason?.message ?? "Error desconocido") };
    }

    if (r3.status === "fulfilled") {
      next.ingresos = { status: "success", data: { mes_actual: r3.value.mes_actual, mes_anterior: r3.value.mes_anterior }, error: null };
    } else {
      next.ingresos = { status: "error", data: null, error: String(r3.reason?.message ?? "Error desconocido") };
    }

    if (r4.status === "fulfilled") {
      next.cancelaciones = { status: "success", data: r4.value.records, error: null };
    } else {
      next.cancelaciones = { status: "error", data: null, error: String(r4.reason?.message ?? "Error desconocido") };
    }

    setState(next);

    if (
      next.facturado.status === "success" &&
      next.porCobrar.status === "success" &&
      next.ingresos.status === "success" &&
      next.cancelaciones.status === "success"
    ) {
      writeCache({
        facturado: next.facturado.data!,
        porCobrar: next.porCobrar.data!,
        ingresos: next.ingresos.data!,
        cancelaciones: next.cancelaciones.data!,
      });
    }
  };

  useEffect(() => {
    const cache = readCache();
    if (cache && !isCacheStale(cache)) return;
    const id = setTimeout(() => { void fetchAll(); }, 1500);
    return () => clearTimeout(id);
     
  }, []);

  async function retryFacturado() {
    setState((p) => ({ ...p, facturado: LOADING }));
    try {
      const r = await getMontoFacturado();
      setState((p) => ({ ...p, facturado: { status: "success", data: { mes_actual: r.mes_actual, mes_anterior: r.mes_anterior }, error: null } }));
    } catch (e) {
      setState((p) => ({ ...p, facturado: { status: "error", data: null, error: String((e as Error).message) } }));
    }
  }

  async function retryPorCobrar() {
    setState((p) => ({ ...p, porCobrar: LOADING }));
    try {
      const r = await getPorCobrar();
      setState((p) => ({ ...p, porCobrar: { status: "success", data: { total: r.total }, error: null } }));
    } catch (e) {
      setState((p) => ({ ...p, porCobrar: { status: "error", data: null, error: String((e as Error).message) } }));
    }
  }

  async function retryIngresos() {
    setState((p) => ({ ...p, ingresos: LOADING }));
    try {
      const r = await getIngresos();
      setState((p) => ({ ...p, ingresos: { status: "success", data: { mes_actual: r.mes_actual, mes_anterior: r.mes_anterior }, error: null } }));
    } catch (e) {
      setState((p) => ({ ...p, ingresos: { status: "error", data: null, error: String((e as Error).message) } }));
    }
  }

  async function retryCancelaciones() {
    setState((p) => ({ ...p, cancelaciones: LOADING }));
    try {
      const r = await getCancelacionesPendientes();
      setState((p) => ({ ...p, cancelaciones: { status: "success", data: r.records, error: null } }));
    } catch (e) {
      setState((p) => ({ ...p, cancelaciones: { status: "error", data: null, error: String((e as Error).message) } }));
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-20 md:pb-4">
      <p className="text-xs text-muted-foreground">
        {mesActualLabel} · vs {mesAnteriorLabel}
      </p>
      <MetricCard
        label="Monto facturado"
        mesActual={state.facturado.data?.mes_actual ?? null}
        mesAnterior={state.facturado.data?.mes_anterior ?? null}
        mesAnteriorLabel={mesAnteriorLabel}
        status={state.facturado.status}
        error={state.facturado.error ?? undefined}
        onRetry={retryFacturado}
      />
      <MetricCard
        label="Por cobrar"
        mesActual={state.porCobrar.data?.total ?? null}
        mesAnterior={null}
        status={state.porCobrar.status}
        error={state.porCobrar.error ?? undefined}
        onRetry={retryPorCobrar}
      />
      <MetricCard
        label="Ingresos registrados"
        mesActual={state.ingresos.data?.mes_actual ?? null}
        mesAnterior={state.ingresos.data?.mes_anterior ?? null}
        mesAnteriorLabel={mesAnteriorLabel}
        status={state.ingresos.status}
        error={state.ingresos.error ?? undefined}
        onRetry={retryIngresos}
      />
      <CancelacionesList
        items={state.cancelaciones.data}
        status={state.cancelaciones.status}
        error={state.cancelaciones.error ?? undefined}
        onRetry={retryCancelaciones}
      />
    </div>
  );
}
