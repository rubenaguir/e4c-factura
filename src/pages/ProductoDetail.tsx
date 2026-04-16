import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  Package,
} from "lucide-react";
import { useProductos } from "@/context/ProductosContext";
import { useLov } from "@/hooks/useLov";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSnackbar } from "@/context/useSnackbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExistenciaNode } from "@/api/endpoints/productos";

// ── LOVs ─────────────────────────────────────────────────────────────────────
const LOV_UNIDAD = "Sistem:Lov:Lov:LoadLovFieldUnidadMedida";

// ── Zod schema ────────────────────────────────────────────────────────────────
const productoSchema = z.object({
  sku: z.string().min(1, "SKU requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  unidad_id: z.string().min(1, "Unidad requerida"),
  estatus: z.string(),
  esquema_impuestos_id: z.string().min(1, "Esquema requerido"),
  almacenable: z.string(),
  costeo: z.string(),
  es_paquete: z.string(),
  es_perecedero: z.string(),
  usa_lotes: z.string(),
  usa_series: z.string(),
  // Opcionales
  codigo_ean: z.string(),
  marca: z.string(),
  modelo: z.string(),
  caracteristicas: z.string(),
  especificaciones: z.string(),
  composicion: z.string(),
  costo_promedio_mn: z.string(),
  categoria_contable_id: z.string(),
  clave_prod_ser_sat: z.string(),
  clave_prod_ser_sat_desc: z.string(),
  mostrar_en_ecommerce: z.string(),
  categoria: z.string(),
  fraccion_arancelaria: z.string(),
  sat_cporte_peso_en_kg: z.string(),
});
type ProductoFormValues = z.infer<typeof productoSchema>;

const defaultValues: ProductoFormValues = {
  sku: "",
  descripcion: "",
  unidad_id: "",
  estatus: "A",
  esquema_impuestos_id: "GENERAL",
  almacenable: "S",
  costeo: "PROMEDIO",
  es_paquete: "N",
  es_perecedero: "N",
  usa_lotes: "N",
  usa_series: "N",
  codigo_ean: "",
  marca: "",
  modelo: "",
  caracteristicas: "",
  especificaciones: "",
  composicion: "",
  costo_promedio_mn: "0.000000",
  categoria_contable_id: "",
  clave_prod_ser_sat: "",
  clave_prod_ser_sat_desc: "",
  mostrar_en_ecommerce: "N",
  categoria: "",
  fraccion_arancelaria: "",
  sat_cporte_peso_en_kg: "",
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── SN Select ─────────────────────────────────────────────────────────────────
function SnSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-9 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="S">Sí</SelectItem>
        <SelectItem value="N">No</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Existencias ───────────────────────────────────────────────────────────────
function ExistenciasPanel({ nodes }: { nodes: ExistenciaNode[] }) {
  if (!nodes || nodes.length === 0) return null;
  const root = nodes.find((n) => !n.almacen_id);
  const hijos = nodes.filter((n) => !!n.almacen_id && n.leaf === "true");

  return (
    <div className="space-y-2">
      {root && (
        <div className="flex items-center justify-between text-sm font-medium border rounded px-3 py-2 bg-muted/30">
          <span>{root.descripcion ?? "Global"}</span>
          <span>{root.existencia}</span>
        </div>
      )}
      {hijos.map((h) => (
        <div
          key={h.almacen_id}
          className="flex items-center justify-between text-sm border rounded px-3 py-2"
        >
          <span className="text-muted-foreground">{h.descripcion ?? h.almacen_id}</span>
          <span>{h.existencia}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductoDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "nuevo";

  const { state, loadOne, add, update } = useProductos();
  const { selected } = state;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const { showError, showSuccess } = useSnackbar();
  const [saving, setSaving] = useState(false);

  const { options: unidadOpts, loading: loadingUnidad } = useLov(
    LOV_UNIDAD,
    "unidad_id",
    "descripcion"
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  });

  // Load existing record
  useEffect(() => {
    if (isNew) return;

    const decodedSku = decodeURIComponent(id!);

    if (selected?.sku === decodedSku) {
      populateForm(selected);
      return;
    }

    setLoadingRecord(true);
    setLoadError(null);
    loadOne(decodedSku)
      .then(() => setLoadingRecord(false))
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : String(e));
        setLoadingRecord(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Populate form when selected changes
  useEffect(() => {
    if (selected) {
      populateForm(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.sku]);

  function populateForm(p: typeof selected) {
    if (!p) return;
    reset({
      sku: p.sku,
      descripcion: p.descripcion,
      unidad_id: p.unidad_id,
      estatus: p.estatus,
      esquema_impuestos_id: p.esquema_impuestos_id,
      almacenable: p.almacenable,
      costeo: p.costeo,
      es_paquete: p.es_paquete,
      es_perecedero: p.es_perecedero,
      usa_lotes: p.usa_lotes,
      usa_series: p.usa_series,
      codigo_ean: p.codigo_ean ?? "",
      marca: p.marca ?? "",
      modelo: p.modelo ?? "",
      caracteristicas: p.caracteristicas ?? "",
      especificaciones: p.especificaciones ?? "",
      composicion: p.composicion ?? "",
      costo_promedio_mn: p.costo_promedio_mn ?? "0.000000",
      categoria_contable_id: p.categoria_contable_id ?? "",
      clave_prod_ser_sat: p.clave_prod_ser_sat ?? "",
      clave_prod_ser_sat_desc: p.clave_prod_ser_sat_desc ?? "",
      mostrar_en_ecommerce: p.mostrar_en_ecommerce ?? "N",
      categoria: p.categoria ?? "",
      fraccion_arancelaria: p.fraccion_arancelaria ?? "",
      sat_cporte_peso_en_kg: p.sat_cporte_peso_en_kg ?? "",
    });
  }

  const onSubmit = async (values: ProductoFormValues) => {
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, String(v ?? "")])
      ) as Record<string, string>;

      if (isNew) {
        const res = await add(payload);
        showSuccess(res.msg);
        navigate(`/productos/${encodeURIComponent(res.sku)}`, { replace: true });
      } else {
        const res = await update(decodeURIComponent(id!), payload);
        showSuccess(res.msg);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingRecord) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate("/productos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate("/productos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold">Error</span>
        </div>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const currentSku = watch("sku");
  const currentEstatus = watch("estatus");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={() => navigate("/productos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold truncate">
            {isNew ? "Nuevo producto" : (currentSku || id)}
          </h1>
          {!isNew && (
            <p className="text-xs text-muted-foreground truncate">
              {watch("descripcion")}
            </p>
          )}
        </div>
        {!isNew && (
          <Badge variant={currentEstatus === "A" ? "default" : "secondary"}>
            {currentEstatus === "A" ? "Activo" : "Inactivo"}
          </Badge>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">

          {/* ── Identificación ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Identificación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="SKU *" error={errors.sku?.message}>
                <Input
                  {...register("sku")}
                  className="h-9 text-sm font-mono"
                  disabled={!isNew}
                  placeholder="Código único"
                />
              </Field>
              <Field label="Código EAN">
                <Input
                  {...register("codigo_ean")}
                  className="h-9 text-sm"
                  placeholder="Código de barras"
                />
              </Field>
              <Field
                label="Descripción *"
                error={errors.descripcion?.message}
              >
                <Input
                  {...register("descripcion")}
                  className="h-9 text-sm col-span-2"
                  placeholder="Descripción del artículo"
                />
              </Field>
              <Field label="Unidad *" error={errors.unidad_id?.message}>
                <Select
                  value={watch("unidad_id")}
                  onValueChange={(v) => setValue("unidad_id", v)}
                  disabled={loadingUnidad}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadOpts.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.value} — {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estatus">
                <Select
                  value={watch("estatus")}
                  onValueChange={(v) => setValue("estatus", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Activo</SelectItem>
                    <SelectItem value="I">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* ── Clasificación ──────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Clasificación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Marca">
                <Input {...register("marca")} className="h-9 text-sm" />
              </Field>
              <Field label="Modelo">
                <Input {...register("modelo")} className="h-9 text-sm" />
              </Field>
              <Field label="Categoría">
                <Input {...register("categoria")} className="h-9 text-sm" />
              </Field>
              <Field label="Categoría contable">
                <Input {...register("categoria_contable_id")} className="h-9 text-sm" />
              </Field>
              <Field label="Clave SAT prod/serv">
                <Input
                  {...register("clave_prod_ser_sat")}
                  className="h-9 text-sm font-mono"
                  placeholder="Ej. 84111506"
                />
              </Field>
              <Field label="Descripción clave SAT">
                <Input
                  {...register("clave_prod_ser_sat_desc")}
                  className="h-9 text-sm"
                />
              </Field>
            </div>
          </section>

          {/* ── Configuración ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Configuración
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Almacenable">
                <SnSelect
                  value={watch("almacenable")}
                  onChange={(v) => setValue("almacenable", v)}
                />
              </Field>
              <Field label="Es paquete">
                <SnSelect
                  value={watch("es_paquete")}
                  onChange={(v) => setValue("es_paquete", v)}
                />
              </Field>
              <Field label="Es perecedero">
                <SnSelect
                  value={watch("es_perecedero")}
                  onChange={(v) => setValue("es_perecedero", v)}
                />
              </Field>
              <Field label="Usa lotes">
                <SnSelect
                  value={watch("usa_lotes")}
                  onChange={(v) => setValue("usa_lotes", v)}
                />
              </Field>
              <Field label="Usa series">
                <SnSelect
                  value={watch("usa_series")}
                  onChange={(v) => setValue("usa_series", v)}
                />
              </Field>
              <Field label="E-commerce">
                <SnSelect
                  value={watch("mostrar_en_ecommerce")}
                  onChange={(v) => setValue("mostrar_en_ecommerce", v)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Costeo">
                <Select
                  value={watch("costeo")}
                  onValueChange={(v) => setValue("costeo", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROMEDIO">Promedio</SelectItem>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="ESTANDAR">Estándar</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Esquema de impuestos *" error={errors.esquema_impuestos_id?.message}>
                <Input
                  {...register("esquema_impuestos_id")}
                  className="h-9 text-sm"
                  placeholder="Ej. GENERAL"
                />
              </Field>
              <Field label="Costo promedio MN">
                <Input
                  {...register("costo_promedio_mn")}
                  className="h-9 text-sm"
                  placeholder="0.000000"
                />
              </Field>
              <Field label="Peso c/porte (kg)">
                <Input
                  {...register("sat_cporte_peso_en_kg")}
                  className="h-9 text-sm"
                  placeholder="0.00"
                />
              </Field>
            </div>
          </section>

          {/* ── Descripción extendida ──────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Descripción extendida
            </h2>
            <div className="space-y-4">
              <Field label="Características">
                <Input {...register("caracteristicas")} className="h-9 text-sm" />
              </Field>
              <Field label="Especificaciones">
                <Input {...register("especificaciones")} className="h-9 text-sm" />
              </Field>
              <Field label="Composición">
                <Input {...register("composicion")} className="h-9 text-sm" />
              </Field>
              <Field label="Fracción arancelaria">
                <Input {...register("fraccion_arancelaria")} className="h-9 text-sm" />
              </Field>
            </div>
          </section>

          {/* ── Impuestos (read-only) ──────────────────────────────────── */}
          {!isNew && selected?.impuestos && selected.impuestos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Impuestos del esquema
              </h2>
              <div className="border rounded divide-y text-sm">
                {selected.impuestos.map((imp, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <span>
                      {imp.aplicacion === "T" ? "Traslado" : "Retención"} · {imp.impuesto}
                    </span>
                    <span className="text-muted-foreground">{imp.tasa}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Existencias (read-only) ────────────────────────────────── */}
          {!isNew && selected?.existencias && selected.existencias.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Existencias
              </h2>
              <ExistenciasPanel nodes={selected.existencias} />
            </section>
          )}

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-2 pb-8">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isNew ? "Crear producto" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/productos")}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
