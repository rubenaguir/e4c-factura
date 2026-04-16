import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-violet-500 text-white",
  "bg-orange-500 text-white",
  "bg-rose-500 text-white",
  "bg-amber-500 text-white",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
import { useClientes } from "@/context/ClientesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSnackbar } from "@/context/useSnackbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClienteRow } from "@/api/endpoints/clientes";

export default function ClientesPage() {
  const navigate = useNavigate();
  const { state, pageSize, search, setSelected } = useClientes();
  const { list, totalCount, loading, error, stale, page, filters } = state;
  const { showError } = useSnackbar();

  const [nombre, setNombre] = useState(filters.nombre ?? "");
  const [rfc, setRfc] = useState(filters.rfc ?? "");
  const [estatus, setEstatus] = useState(filters.estatus || "A");

  // Initial load / stale reload
  useEffect(() => {
    if (stale) {
      search({ nombre, rfc, estatus }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    search({ nombre, rfc, estatus: estatus === "all" ? "" : estatus }, 0, true);
  };

  const handleRowClick = (row: ClienteRow) => {
    setSelected(null); // clear so detail re-fetches
    navigate(`/clientes/${row.cliente_id}`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Clientes</h1>
        <Button size="sm" onClick={() => navigate("/clientes/nuevo")}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-2 px-4 py-3 border-b bg-muted/30"
      >
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nombre"
            className="pl-8 h-9 text-sm"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <Input
          placeholder="RFC"
          className="w-36 h-9 text-sm uppercase"
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
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
      <div className="flex-1 overflow-auto">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-primary/70 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-white">RFC</th>
                <th className="text-left px-4 py-2 font-medium text-white">Nombre</th>
                <th className="text-left px-4 py-2 font-medium text-white">CP</th>
                <th className="text-left px-4 py-2 font-medium text-white">Estado</th>
                <th className="text-left px-4 py-2 font-medium text-white">Estatus</th>
                <th className="text-left px-4 py-2 font-medium text-white">Actualización</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-14" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-32" /></td>
                  </tr>
                ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                list.map((row, i) => (
                  <tr
                    key={row.cliente_id}
                    onClick={() => handleRowClick(row)}
                    className={["border-b cursor-pointer transition-colors hover:bg-primary/8", i % 2 === 1 ? "bg-muted/20" : ""].join(" ")}
                  >
                    <td className="px-4 py-2 font-mono text-xs">{row.rfc}</td>
                    <td className="px-4 py-2">{row.nombre}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.codigo_postal ?? "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.estado ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge variant={row.estatus === "A" ? "default" : "secondary"}>
                        {row.estatus === "A" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{row.actualizacion_fecha}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          {!loading && list.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin resultados</p>
          )}
          {!loading &&
            list.map((row, i) => (
              <button
                key={row.cliente_id}
                type="button"
                onClick={() => handleRowClick(row)}
                className={["w-full text-left px-4 py-3 transition-colors hover:bg-primary/8", i % 2 === 1 ? "bg-muted/20" : ""].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div className={["h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor(row.nombre)].join(" ")}>
                    {getInitials(row.nombre)}
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{row.nombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">{row.rfc}</p>
                      {(row.codigo_postal || row.estado) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[row.codigo_postal, row.estado].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={row.estatus === "A" ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {row.estatus === "A" ? "Activo" : "Inact."}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-background text-sm">
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
