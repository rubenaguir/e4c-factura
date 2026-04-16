import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useProductos } from "@/context/ProductosContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSnackbar } from "@/context/useSnackbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductoRow } from "@/api/endpoints/productos";

const ROW_HEIGHT = 88;

export default function ProductosPage() {
  const navigate = useNavigate();
  const { state, pageSize, search, setSelected } = useProductos();
  const { list, totalCount, loading, error, stale, page, filters } = state;
  const { showError } = useSnackbar();

  const [descripcion, setDescripcion] = useState(filters.descripcion ?? "");
  const [sku, setSku] = useState(filters.sku ?? "");
  const [estatus, setEstatus] = useState(filters.estatus || "A");

  // Initial load / stale reload
  useEffect(() => {
    if (stale) {
      search({ descripcion, sku, estatus: estatus === "all" ? "" : estatus }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search-as-you-type — debounce lives in context
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    search({ descripcion, sku, estatus: estatus === "all" ? "" : estatus }, 0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descripcion, sku, estatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search({ descripcion, sku, estatus: estatus === "all" ? "" : estatus }, 0, true);
  };

  const handleRowClick = (row: ProductoRow) => {
    setSelected(null);
    navigate(`/productos/${encodeURIComponent(row.sku)}`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  // Virtualized list
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: list.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Productos</h1>
        <Button size="sm" onClick={() => navigate("/productos/nuevo")}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-2 px-4 py-3 border-b bg-muted/30"
      >
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Descripción"
            className="pl-8 h-9 text-sm"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <Input
          placeholder="SKU"
          className="w-32 h-9 text-sm"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
        <Select value={estatus} onValueChange={setEstatus}>
          <SelectTrigger className="w-28 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Activos</SelectItem>
            <SelectItem value="I">Inactivos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={loading} className="h-9">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-1 hidden sm:inline">Buscar</span>
        </Button>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Desktop sticky header */}
        <div className="hidden md:flex shrink-0 bg-primary/70 text-sm">
          <div className="px-4 py-2 w-40 font-medium text-white">SKU</div>
          <div className="px-4 py-2 flex-1 font-medium text-white">Descripción</div>
          <div className="px-4 py-2 w-32 font-medium text-white">Marca</div>
          <div className="px-4 py-2 w-32 font-medium text-white">Modelo</div>
          <div className="px-4 py-2 w-32 font-medium text-white">Clave SAT</div>
          <div className="px-4 py-2 w-20 font-medium text-white">Unidad</div>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="p-4 space-y-3 shrink-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && list.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Sin resultados
          </p>
        )}

        {/* Virtualized scroll container */}
        {!loading && list.length > 0 && (
          <div ref={parentRef} className="flex-1 overflow-auto min-h-0">
            <div
              style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
            >
              {rowVirtualizer.getVirtualItems().map((vRow) => {
                const row = list[vRow.index];
                return (
                  <div
                    key={row.sku}
                    onClick={() => handleRowClick(row)}
                    className={["absolute w-full flex items-center border-b cursor-pointer transition-colors hover:bg-primary/8", vRow.index % 2 === 1 ? "bg-muted/20" : ""].join(" ")}
                    style={{ top: vRow.start, height: vRow.size }}
                  >
                    {/* Desktop layout */}
                    <div className="hidden md:flex w-full items-center text-sm">
                      <div className="px-4 w-40 font-mono text-xs truncate">{row.sku}</div>
                      <div className="px-4 flex-1 truncate">{row.descripcion}</div>
                      <div className="px-4 w-32 text-muted-foreground text-xs truncate">{row.marca}</div>
                      <div className="px-4 w-32 text-muted-foreground text-xs truncate">{row.modelo}</div>
                      <div className="px-4 w-32 text-muted-foreground font-mono text-xs truncate">{row.clave_prod_ser_sat}</div>
                      <div className="px-4 w-20 text-muted-foreground text-xs">{row.unidad_id}</div>
                    </div>

                    {/* Mobile layout */}
                    <div className="md:hidden flex w-full items-center px-4 py-2">
                      <div className="min-w-0 w-full">
                        <p className="h-5 font-medium text-sm truncate">{row.descripcion}</p>
                        <p className="h-4 text-xs text-muted-foreground font-mono truncate">SKU: {row.sku || ""}</p>
                        <p className="h-4 text-xs text-muted-foreground truncate">Marca / Modelo : {[row.marca, row.modelo].filter(Boolean).join(" / ") || ""}</p>
                        <p className="h-4 text-xs text-muted-foreground font-mono truncate">Clave SAT: {row.clave_prod_ser_sat || ""}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-background text-sm shrink-0">
          <span className="text-muted-foreground">
            {totalCount} registro{totalCount !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Página ${page + 1} de ${totalPages}`}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => search(undefined, page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext || loading}
              onClick={() => search(undefined, page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
