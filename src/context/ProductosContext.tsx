import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  searchProductos,
  loadProducto,
  addProducto,
  updateProducto,
} from "@/api/endpoints/productos";
import type { ProductoRow, ProductoDetalle } from "@/api/endpoints/productos";

const PAGE_SIZE = 100;
const DEBOUNCE_MS = 300;

interface ProductosState {
  list: ProductoRow[];
  totalCount: number;
  filters: Record<string, string>;
  page: number;
  stale: boolean;
  loading: boolean;
  error: string | null;
  selected: ProductoDetalle | null;
}

const initialState: ProductosState = {
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
  | { type: "SEARCH_OK"; records: ProductoRow[]; totalCount: number }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "LOAD_OK"; record: ProductoDetalle }
  | { type: "MUTATE_OK"; record: ProductoDetalle }
  | { type: "SET_SELECTED"; record: ProductoDetalle | null }
  | { type: "INVALIDATE" };

function reducer(state: ProductosState, action: Action): ProductosState {
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

interface ProductosContextValue {
  state: ProductosState;
  pageSize: number;
  search: (filters?: Record<string, string>, page?: number, force?: boolean) => void;
  loadOne: (sku: string) => Promise<void>;
  add: (data: Record<string, string>) => Promise<{ sku: string; msg: string }>;
  update: (sku: string, data: Record<string, string>) => Promise<{ msg: string }>;
  setSelected: (record: ProductoDetalle | null) => void;
  invalidate: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ProductosContext = createContext<ProductosContextValue | null>(null);

export function ProductosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (filters: Record<string, string>, page: number) => {
    dispatch({ type: "SEARCH_START", filters, page });
    try {
      const res = await searchProductos({
        ...filters,
        start: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      } as Parameters<typeof searchProductos>[0]);
      dispatch({ type: "SEARCH_OK", records: res.records, totalCount: res.totalCount });
    } catch (e) {
      dispatch({
        type: "SEARCH_ERROR",
        error: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }, []);

  const search = useCallback(
    (filters?: Record<string, string>, page = 0, force = false) => {
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

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(activeFilters, page);
      }, DEBOUNCE_MS);
    },
    [doSearch]
  );

  const loadOne = useCallback(async (sku: string) => {
    const record = await loadProducto(sku);
    dispatch({ type: "LOAD_OK", record });
  }, []);

  const add = useCallback(async (data: Record<string, string>) => {
    const res = await addProducto(data);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { sku: res.record.sku, msg: res.msg };
  }, []);

  const update = useCallback(async (sku: string, data: Record<string, string>) => {
    const res = await updateProducto(sku, data);
    dispatch({ type: "MUTATE_OK", record: res.record });
    dispatch({ type: "INVALIDATE" });
    return { msg: res.msg };
  }, []);

  const setSelected = useCallback((record: ProductoDetalle | null) => {
    dispatch({ type: "SET_SELECTED", record });
  }, []);

  const invalidate = useCallback(() => {
    dispatch({ type: "INVALIDATE" });
  }, []);

  return (
    <ProductosContext.Provider
      value={{ state, pageSize: PAGE_SIZE, search, loadOne, add, update, setSelected, invalidate }}
    >
      {children}
    </ProductosContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProductos() {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error("useProductos must be used within ProductosProvider");
  return ctx;
}
