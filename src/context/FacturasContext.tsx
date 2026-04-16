import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  searchFacturas,
  loadFactura,
  loadPresetClientData as apiLoadPreset,
  addPrefactura as apiAddPrefactura,
  updatePrefactura as apiUpdatePrefactura,
  addFactura as apiAddFactura,
  stampFactura as apiStamp,
  cancelFactura as apiCancel,
  sendMailFactura as apiSendMail,
  printPdfFactura as apiPrintPdf,
} from "@/api/endpoints/facturas";
import type {
  FacturaRow,
  FacturaCompleta,
  FacturaPayload,
  FacturaSearchParams,
} from "@/api/endpoints/facturas";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface FacturasState {
  list: FacturaRow[];
  totalCount: number;
  filters: FacturaSearchParams;
  page: number;
  stale: boolean;
  loading: boolean;
  error: string | null;
  selected: FacturaCompleta | null;
}

const defaultFilters: FacturaSearchParams = {};

const initialState: FacturasState = {
  list: [],
  totalCount: 0,
  filters: defaultFilters,
  page: 0,
  stale: true,
  loading: false,
  error: null,
  selected: null,
};

type Action =
  | { type: "SEARCH_START"; filters: FacturaSearchParams; page: number }
  | { type: "SEARCH_OK"; records: FacturaRow[]; totalCount: number }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "LOAD_OK"; record: FacturaCompleta }
  | { type: "MUTATE_OK"; record: FacturaCompleta }
  | { type: "SET_SELECTED"; record: FacturaCompleta | null }
  | { type: "INVALIDATE" };

function reducer(state: FacturasState, action: Action): FacturasState {
  switch (action.type) {
    case "SEARCH_START":
      return {
        ...state,
        loading: true,
        error: null,
        filters: action.filters,
        page: action.page,
      };
    case "SEARCH_OK":
      return {
        ...state,
        loading: false,
        stale: false,
        list: action.records,
        totalCount: action.totalCount,
      };
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

interface FacturasContextValue {
  state: FacturasState;
  pageSize: number;
  search: (
    filters?: FacturaSearchParams,
    page?: number,
    force?: boolean
  ) => Promise<void>;
  loadOne: (serie: string, folio: string) => Promise<void>;
  loadPresetClientData: (clienteId: string) => Promise<FacturaCompleta>;
  /** Crear prefactura sin timbrar */
  addPrefactura: (
    payload: FacturaPayload
  ) => Promise<{ msg: string; record: FacturaCompleta }>;
  /** Actualizar prefactura existente */
  updatePrefactura: (
    payload: FacturaPayload
  ) => Promise<{ msg: string; record: FacturaCompleta }>;
  /** Crear y timbrar en un paso */
  addFactura: (
    payload: FacturaPayload
  ) => Promise<{ msg: string; record: FacturaCompleta }>;
  /** Timbrar una prefactura existente */
  stamp: (
    payload: FacturaPayload
  ) => Promise<{ msg: string; record: FacturaCompleta }>;
  /** Cancelar ante el SAT (flujo de dos pasos) */
  cancel: (
    serie: string,
    folio: string,
    motivo: string,
    folioSustitucion: string
  ) => Promise<{ msg: string; record: FacturaCompleta }>;
  setSelected: (record: FacturaCompleta | null) => void;
  invalidate: () => void;
  sendMail: (
    serie: string,
    folio: string,
    nombre: string,
    correo: string,
    asunto: string
  ) => Promise<{ msg: string }>;
  printPdf: (
    empresaId: string,
    serie: string,
    folio: string,
    printMetodoPago: string
  ) => Promise<Blob>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const FacturasContext = createContext<FacturasContextValue | null>(null);

export function FacturasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Mirror state in a ref so stable callbacks can read the latest values
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // ------------------------------------------------------------------
  // Search
  // ------------------------------------------------------------------

  const search = useCallback(
    async (filters?: FacturaSearchParams, page = 0, force = false) => {
      const {
        loading,
        stale,
        page: curPage,
        filters: curFilters,
      } = stateRef.current;
      const activeFilters = filters ?? curFilters;

      if (loading) return;
      if (
        !force &&
        !stale &&
        page === curPage &&
        JSON.stringify(activeFilters) === JSON.stringify(curFilters)
      )
        return;

      dispatch({ type: "SEARCH_START", filters: activeFilters, page });
      try {
        const res = await searchFacturas({
          ...activeFilters,
          start: page * PAGE_SIZE,
          limit: PAGE_SIZE,
        });
        dispatch({
          type: "SEARCH_OK",
          records: res.records,
          totalCount: res.totalCount,
        });
      } catch (e) {
        dispatch({
          type: "SEARCH_ERROR",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [] // stable — reads latest state via ref
  );

  // ------------------------------------------------------------------
  // Load single
  // ------------------------------------------------------------------

  const loadOne = useCallback(async (serie: string, folio: string) => {
    const record = await loadFactura(serie, folio);
    dispatch({ type: "LOAD_OK", record });
  }, []);

  const loadPresetClientData = useCallback((clienteId: string) => {
    return apiLoadPreset(clienteId);
  }, []);

  // ------------------------------------------------------------------
  // Mutations — each invalidates the list so it refreshes on next visit
  // ------------------------------------------------------------------

  const addPrefactura = useCallback(async (payload: FacturaPayload) => {
    const res = await apiAddPrefactura(payload);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg, record: res.record };
  }, []);

  const updatePrefactura = useCallback(
    async (payload: FacturaPayload) => {
      const res = await apiUpdatePrefactura(payload);
      dispatch({ type: "MUTATE_OK", record: res.record });
      dispatch({ type: "INVALIDATE" });
      return { msg: res.msg, record: res.record };
    },
    []
  );

  const addFactura = useCallback(async (payload: FacturaPayload) => {
    const res = await apiAddFactura(payload);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg, record: res.record };
  }, []);

  const stamp = useCallback(
    async (payload: FacturaPayload) => {
      const res = await apiStamp(payload);
      dispatch({ type: "MUTATE_OK", record: res.record });
      dispatch({ type: "INVALIDATE" });
      return { msg: res.msg, record: res.record };
    },
    []
  );

  const cancel = useCallback(
    async (
      serie: string,
      folio: string,
      motivo: string,
      folioSustitucion: string
    ) => {
      const res = await apiCancel(serie, folio, motivo, folioSustitucion);
      dispatch({ type: "MUTATE_OK", record: res.record });
      dispatch({ type: "INVALIDATE" });
      return { msg: res.msg, record: res.record };
    },
    []
  );

  // ------------------------------------------------------------------
  // Non-mutating helpers
  // ------------------------------------------------------------------

  const setSelected = useCallback((record: FacturaCompleta | null) => {
    dispatch({ type: "SET_SELECTED", record });
  }, []);

  const invalidate = useCallback(() => {
    dispatch({ type: "INVALIDATE" });
  }, []);

  const sendMail = useCallback(
    (
      serie: string,
      folio: string,
      nombre: string,
      correo: string,
      asunto: string
    ) => apiSendMail(serie, folio, nombre, correo, asunto),
    []
  );

  const printPdf = useCallback(
    (
      empresaId: string,
      serie: string,
      folio: string,
      printMetodoPago: string
    ) => apiPrintPdf(empresaId, serie, folio, printMetodoPago),
    []
  );

  return (
    <FacturasContext.Provider
      value={{
        state,
        pageSize: PAGE_SIZE,
        search,
        loadOne,
        loadPresetClientData,
        addPrefactura,
        updatePrefactura,
        addFactura,
        stamp,
        cancel,
        setSelected,
        invalidate,
        sendMail,
        printPdf,
      }}
    >
      {children}
    </FacturasContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFacturas(): FacturasContextValue {
  const ctx = useContext(FacturasContext);
  if (!ctx) throw new Error("useFacturas must be used within FacturasProvider");
  return ctx;
}
