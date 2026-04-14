import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import {
  searchClientes,
  loadCliente,
  addCliente,
  updateCliente,
  validateCodigoPostal,
  searchDirecciones as apiSearchDirecciones,
  saveDireccion as apiSaveDireccion,
} from "@/api/endpoints/clientes";
import type {
  ClienteRow,
  ClienteDetalle,
  Direccion,
  ValidateCPResponse,
} from "@/api/endpoints/clientes";

const PAGE_SIZE = 25;

interface ClientesState {
  list: ClienteRow[];
  totalCount: number;
  filters: Record<string, string>;
  page: number;
  stale: boolean;
  loading: boolean;
  error: string | null;
  selected: ClienteDetalle | null;
}

const initialState: ClientesState = {
  list: [],
  totalCount: 0,
  filters: { estatus: "A" },
  page: 0,
  stale: true,
  loading: false,
  error: null,
  selected: null,
};

type Action =
  | { type: "SEARCH_START"; filters: Record<string, string>; page: number }
  | { type: "SEARCH_OK"; records: ClienteRow[]; totalCount: number }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "LOAD_OK"; record: ClienteDetalle }
  | { type: "MUTATE_OK"; record: ClienteDetalle }
  | { type: "SET_SELECTED"; record: ClienteDetalle | null }
  | { type: "INVALIDATE" };

function reducer(state: ClientesState, action: Action): ClientesState {
  switch (action.type) {
    case "SEARCH_START":
      return { ...state, loading: true, error: null, filters: action.filters, page: action.page };
    case "SEARCH_OK":
      return { ...state, loading: false, stale: false, list: action.records, totalCount: action.totalCount };
    case "SEARCH_ERROR":
      return { ...state, loading: false, error: action.error };
    case "LOAD_OK":
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

interface ClientesContextValue {
  state: ClientesState;
  pageSize: number;
  search: (filters?: Record<string, string>, page?: number, force?: boolean) => Promise<void>;
  loadOne: (clienteId: string) => Promise<void>;
  add: (data: Record<string, string>) => Promise<{ clienteId: string; msg: string }>;
  update: (clienteId: string, data: Record<string, string>) => Promise<{ msg: string }>;
  setSelected: (record: ClienteDetalle | null) => void;
  invalidate: () => void;
  validateCP: (cp: string) => Promise<ValidateCPResponse>;
  searchDirecciones: (clienteId: string) => Promise<Direccion[]>;
  saveDireccion: (data: Record<string, string>) => Promise<{ msg: string; record: Direccion }>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ClientesContext = createContext<ClientesContextValue | null>(null);

export function ClientesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Keep a ref so stable callbacks can read the latest state
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const search = useCallback(
    async (filters?: Record<string, string>, page = 0, force = false) => {
      const { loading, stale, page: curPage, filters: curFilters } = stateRef.current;
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
        const res = await searchClientes({
          ...activeFilters,
          start: page * PAGE_SIZE,
          limit: PAGE_SIZE,
        } as Parameters<typeof searchClientes>[0]);
        dispatch({ type: "SEARCH_OK", records: res.records, totalCount: res.totalCount });
      } catch (e) {
        dispatch({
          type: "SEARCH_ERROR",
          error: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    },
    [] // stable — reads latest state via ref
  );

  const loadOne = useCallback(async (clienteId: string) => {
    const record = await loadCliente(clienteId);
    dispatch({ type: "LOAD_OK", record });
  }, []);

  const add = useCallback(async (data: Record<string, string>) => {
    const res = await addCliente(data);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { clienteId: res.record.cliente_id, msg: res.msg };
  }, []);

  const update = useCallback(async (clienteId: string, data: Record<string, string>) => {
    const res = await updateCliente(clienteId, data);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg };
  }, []);

  const setSelected = useCallback((record: ClienteDetalle | null) => {
    dispatch({ type: "SET_SELECTED", record });
  }, []);

  const invalidate = useCallback(() => {
    dispatch({ type: "INVALIDATE" });
  }, []);

  const validateCP = useCallback(
    (cp: string) => validateCodigoPostal(cp),
    []
  );

  const searchDirecciones = useCallback(async (clienteId: string) => {
    const res = await apiSearchDirecciones(clienteId);
    return res.records;
  }, []);

  const saveDireccion = useCallback(
    (data: Record<string, string>) => apiSaveDireccion(data),
    []
  );

  return (
    <ClientesContext.Provider
      value={{
        state,
        pageSize: PAGE_SIZE,
        search,
        loadOne,
        add,
        update,
        setSelected,
        invalidate,
        validateCP,
        searchDirecciones,
        saveDireccion,
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClientes() {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error("useClientes must be used within ClientesProvider");
  return ctx;
}
