import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  searchIngresos,
  loadIngreso,
  addIngreso as apiAdd,
  stampIngreso as apiStamp,
  cancelIngreso as apiCancel,
  sendMailIngreso as apiSendMail,
  printPdfIngreso as apiPrintPdf,
} from "@/api/endpoints/ingresos";
import type {
  IngresoRow,
  IngresoDetalle,
  IngresoAddPayload,
  IngresoSearchParams,
} from "@/api/endpoints/ingresos";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface IngresosState {
  list: IngresoRow[];
  totalCount: number;
  filters: IngresoSearchParams;
  page: number;
  stale: boolean;
  loading: boolean;
  error: string | null;
  selected: IngresoDetalle | null;
}

const initialState: IngresosState = {
  list: [],
  totalCount: 0,
  filters: {},
  page: 0,
  stale: true,
  loading: false,
  error: null,
  selected: null,
};

type Action =
  | { type: "SEARCH_START"; filters: IngresoSearchParams; page: number }
  | { type: "SEARCH_OK"; records: IngresoRow[]; totalCount: number }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "LOAD_OK"; record: IngresoDetalle }
  | { type: "MUTATE_OK"; record: IngresoDetalle }
  | { type: "SET_SELECTED"; record: IngresoDetalle | null }
  | { type: "INVALIDATE" };

function reducer(state: IngresosState, action: Action): IngresosState {
  switch (action.type) {
    case "SEARCH_START":
      return { ...state, loading: true, error: null, filters: action.filters, page: action.page };
    case "SEARCH_OK":
      return { ...state, loading: false, stale: false, list: action.records, totalCount: action.totalCount };
    case "SEARCH_ERROR":
      return { ...state, loading: false, error: action.error };
    case "LOAD_OK":
      return { ...state, selected: action.record };
    case "MUTATE_OK":
      return { ...state, selected: action.record };
    case "SET_SELECTED":
      return { ...state, selected: action.record };
    case "INVALIDATE":
      return { ...state, stale: true };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

interface IngresosContextValue {
  state: IngresosState;
  pageSize: number;
  search: (filters?: IngresoSearchParams, page?: number, force?: boolean) => Promise<void>;
  loadOne: (serie: string, folio: string) => Promise<IngresoDetalle>;
  add: (payload: IngresoAddPayload) => Promise<{ msg: string; record: IngresoDetalle }>;
  stamp: (serie: string, folio: string) => Promise<{ msg: string; record: IngresoDetalle }>;
  cancel: (serie: string, folio: string, motivo: string) => Promise<{ msg: string; record: IngresoDetalle }>;
  sendMail: (serie: string, folio: string, nombre: string, correo: string) => Promise<{ msg: string }>;
  printPdf: (serie: string, folio: string) => Promise<Blob>;
  setSelected: (record: IngresoDetalle | null) => void;
  invalidate: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const IngresosContext = createContext<IngresosContextValue | null>(null);

export function IngresosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // ------------------------------------------------------------------
  // Search
  // ------------------------------------------------------------------

  const search = useCallback(
    async (filters?: IngresoSearchParams, page = 0, force = false) => {
      const { loading, stale, page: curPage, filters: curFilters } = stateRef.current;
      const activeFilters = filters ?? curFilters;

      if (loading) return;
      if (!force && !stale && page === curPage && JSON.stringify(activeFilters) === JSON.stringify(curFilters))
        return;

      dispatch({ type: "SEARCH_START", filters: activeFilters, page });
      try {
        const res = await searchIngresos({ ...activeFilters, start: page * PAGE_SIZE, limit: PAGE_SIZE });
        dispatch({ type: "SEARCH_OK", records: res.records, totalCount: res.totalCount });
      } catch (e) {
        dispatch({ type: "SEARCH_ERROR", error: e instanceof Error ? e.message : String(e) });
      }
    },
    []
  );

  // ------------------------------------------------------------------
  // Load single
  // ------------------------------------------------------------------

  const loadOne = useCallback(async (serie: string, folio: string) => {
    const record = await loadIngreso(serie, folio);
    dispatch({ type: "LOAD_OK", record });
    return record;
  }, []);

  // ------------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------------

  const add = useCallback(async (payload: IngresoAddPayload) => {
    const res = await apiAdd(payload);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg, record: res.record };
  }, []);

  const stamp = useCallback(async (serie: string, folio: string) => {
    const res = await apiStamp(serie, folio);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg, record: res.record };
  }, []);

  const cancel = useCallback(async (serie: string, folio: string, motivo: string) => {
    const res = await apiCancel(serie, folio, motivo);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg, record: res.record };
  }, []);

  // ------------------------------------------------------------------
  // Non-mutating helpers
  // ------------------------------------------------------------------

  const setSelected = useCallback((record: IngresoDetalle | null) => {
    dispatch({ type: "SET_SELECTED", record });
  }, []);

  const invalidate = useCallback(() => {
    dispatch({ type: "INVALIDATE" });
  }, []);

  const sendMail = useCallback(
    (serie: string, folio: string, nombre: string, correo: string) =>
      apiSendMail(serie, folio, nombre, correo),
    []
  );

  const printPdf = useCallback(
    (serie: string, folio: string) => apiPrintPdf(serie, folio),
    []
  );

  return (
    <IngresosContext.Provider value={{
      state,
      pageSize: PAGE_SIZE,
      search,
      loadOne,
      add,
      stamp,
      cancel,
      sendMail,
      printPdf,
      setSelected,
      invalidate,
    }}>
      {children}
    </IngresosContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIngresos(): IngresosContextValue {
  const ctx = useContext(IngresosContext);
  if (!ctx) throw new Error("useIngresos must be used within IngresosProvider");
  return ctx;
}
