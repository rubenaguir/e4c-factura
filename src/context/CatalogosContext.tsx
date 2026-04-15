/**
 * CatalogosContext — catálogos SAT cargados lazy por sesión.
 *
 * Uso:
 *   const { usoCfdi, moneda, ensure } = useCatalogos();
 *   useEffect(() => { ensure("usoCfdi"); ensure("moneda"); }, [ensure]);
 *
 * Garantías:
 *   - Cada catálogo se fetchea como máximo una vez por sesión.
 *   - Al hacer logout, todo el estado se limpia (se llama clearLovCache también).
 *   - "objetoImpuesto" es estático, siempre disponible sin necesidad de ensure().
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { clearLovCache } from "@/hooks/useLov";
import type { LovOption } from "@/hooks/useLov";
import {
  OBJETO_IMPUESTO_RECORDS,
  loadUsoCfdi,
  loadFormaPago,
  loadMetodoPago,
  loadRegimenFiscal,
  loadMoneda,
  loadUnidadMedida,
} from "@/api/endpoints/lovs";
import type {
  CatalogName,
  UsoCfdiRecord,
  FormaPagoRecord,
  MetodoPagoRecord,
  RegimenFiscalRecord,
  MonedaRecord,
  UnidadMedidaRecord,
  ObjetoImpuestoRecord,
} from "@/api/endpoints/lovs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogEntry<T> {
  records: T[];
  options: LovOption[];
  loading: boolean;
  error: string | null;
  /** true once the fetch completed (success or error) */
  fetched: boolean;
}

export interface CatalogosContextValue {
  usoCfdi: CatalogEntry<UsoCfdiRecord>;
  formaPago: CatalogEntry<FormaPagoRecord>;
  metodoPago: CatalogEntry<MetodoPagoRecord>;
  regimenFiscal: CatalogEntry<RegimenFiscalRecord>;
  moneda: CatalogEntry<MonedaRecord>;
  unidadMedida: CatalogEntry<UnidadMedidaRecord>;
  objetoImpuesto: CatalogEntry<ObjetoImpuestoRecord>;
  /**
   * Garantiza que el catálogo esté cargado.
   * Llama desde useEffect en el componente que lo necesite.
   * "objetoImpuesto" siempre está disponible, no requiere ensure().
   */
  ensure: (name: CatalogName) => void;
}

// ---------------------------------------------------------------------------
// Helpers: convert raw records to LovOption[]
// ---------------------------------------------------------------------------

function toOptions<T extends Record<string, string>>(
  records: T[],
  valueField: keyof T,
  labelField: keyof T
): LovOption[] {
  return records.map((r) => ({
    value: r[valueField] as string,
    label: r[labelField] as string,
  }));
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type RawRecord = Record<string, string>;

interface SingleCatalogState {
  records: RawRecord[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
}

type ReducerState = Record<CatalogName, SingleCatalogState>;

type Action =
  | { type: "LOADING"; name: CatalogName }
  | { type: "LOADED"; name: CatalogName; records: RawRecord[] }
  | { type: "ERROR"; name: CatalogName; error: string }
  | { type: "CLEAR_ALL" };

const empty: SingleCatalogState = {
  records: [],
  loading: false,
  error: null,
  fetched: false,
};

function initialState(): ReducerState {
  return {
    usoCfdi: { ...empty },
    formaPago: { ...empty },
    metodoPago: { ...empty },
    regimenFiscal: { ...empty },
    moneda: { ...empty },
    unidadMedida: { ...empty },
    // Static catalog pre-populated
    objetoImpuesto: {
      records: OBJETO_IMPUESTO_RECORDS as unknown as RawRecord[],
      loading: false,
      error: null,
      fetched: true,
    },
  };
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case "LOADING":
      return {
        ...state,
        [action.name]: { ...state[action.name], loading: true, error: null },
      };
    case "LOADED":
      return {
        ...state,
        [action.name]: {
          records: action.records,
          loading: false,
          error: null,
          fetched: true,
        },
      };
    case "ERROR":
      return {
        ...state,
        [action.name]: {
          ...state[action.name],
          loading: false,
          error: action.error,
          fetched: true,
        },
      };
    case "CLEAR_ALL":
      return initialState();
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Fetcher map
// ---------------------------------------------------------------------------

const FETCHERS: Record<
  Exclude<CatalogName, "objetoImpuesto">,
  () => Promise<RawRecord[]>
> = {
  usoCfdi: loadUsoCfdi as unknown as () => Promise<RawRecord[]>,
  formaPago: loadFormaPago as unknown as () => Promise<RawRecord[]>,
  metodoPago: loadMetodoPago as unknown as () => Promise<RawRecord[]>,
  regimenFiscal: loadRegimenFiscal as unknown as () => Promise<RawRecord[]>,
  moneda: loadMoneda as unknown as () => Promise<RawRecord[]>,
  unidadMedida: loadUnidadMedida as unknown as () => Promise<RawRecord[]>,
};

// ---------------------------------------------------------------------------
// Option converters per catalog
// ---------------------------------------------------------------------------

function toEntryOptions(name: CatalogName, records: RawRecord[]): LovOption[] {
  switch (name) {
    case "usoCfdi":
      return toOptions(records, "uso_id", "descripcion");
    case "formaPago":
    case "metodoPago":
      return toOptions(records, "clave", "descripcion");
    case "regimenFiscal":
      return toOptions(records, "regimen_fiscal_id", "regimen");
    case "moneda":
      return toOptions(records, "moneda_id", "descripcion");
    case "unidadMedida":
      return toOptions(records, "unidad_id", "descripcion");
    case "objetoImpuesto":
      return toOptions(records, "clave", "descripcion");
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const CatalogosContext = createContext<CatalogosContextValue | null>(null);

export function CatalogosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { isAuthenticated } = useAuth();

  // Mirror state in a ref so `ensure` can read it without being re-created
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Guard set to prevent concurrent duplicate fetches for the same catalog
  const inFlightRef = useRef<Set<CatalogName>>(new Set());

  // Clear all caches when the user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: "CLEAR_ALL" });
      inFlightRef.current.clear();
      clearLovCache(); // also clear the useLov module-level cache
    }
  }, [isAuthenticated]);

  const ensure = useCallback((name: CatalogName) => {
    if (name === "objetoImpuesto") return; // always available, no fetch needed
    const current = stateRef.current[name];
    if (current.fetched || current.loading || inFlightRef.current.has(name)) return;

    inFlightRef.current.add(name);
    dispatch({ type: "LOADING", name });

    FETCHERS[name as Exclude<CatalogName, "objetoImpuesto">]()
      .then((records) => dispatch({ type: "LOADED", name, records }))
      .catch((err) =>
        dispatch({ type: "ERROR", name, error: String(err) })
      )
      .finally(() => inFlightRef.current.delete(name));
  }, []);

  // Build typed CatalogEntry for each catalog
  function buildEntry<T>(name: CatalogName): CatalogEntry<T> {
    const s = state[name];
    return {
      records: s.records as unknown as T[],
      options: toEntryOptions(name, s.records),
      loading: s.loading,
      error: s.error,
      fetched: s.fetched,
    };
  }

  const value: CatalogosContextValue = {
    usoCfdi: buildEntry<UsoCfdiRecord>("usoCfdi"),
    formaPago: buildEntry<FormaPagoRecord>("formaPago"),
    metodoPago: buildEntry<MetodoPagoRecord>("metodoPago"),
    regimenFiscal: buildEntry<RegimenFiscalRecord>("regimenFiscal"),
    moneda: buildEntry<MonedaRecord>("moneda"),
    unidadMedida: buildEntry<UnidadMedidaRecord>("unidadMedida"),
    objetoImpuesto: buildEntry<ObjetoImpuestoRecord>("objetoImpuesto"),
    ensure,
  };

  return (
    <CatalogosContext.Provider value={value}>
      {children}
    </CatalogosContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogos(): CatalogosContextValue {
  const ctx = useContext(CatalogosContext);
  if (!ctx) throw new Error("useCatalogos must be used inside <CatalogosProvider>");
  return ctx;
}
