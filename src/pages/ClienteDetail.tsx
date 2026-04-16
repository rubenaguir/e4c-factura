import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  Pencil,
} from "lucide-react";
import { useClientes } from "@/context/ClientesContext";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Direccion } from "@/api/endpoints/clientes";

// ── LOV constants ────────────────────────────────────────────────────────────
const LOV_REGIMEN = "sistema:empresas:empresas:SearchRegimenesSAT";

// ── Zod schema ───────────────────────────────────────────────────────────────
const clienteSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  rfc: z.string().min(1, "RFC requerido"),
  codigo_postal: z.string().min(1, "CP requerido"),
  regimen_fiscal_id: z.string().min(1, "Régimen fiscal requerido"),
  estatus: z.string(),
  // Dirección
  calle: z.string(),
  no_exterior: z.string(),
  no_interior: z.string(),
  c_colonia: z.string(),
  colonia: z.string(),
  c_municipio: z.string(),
  municipio: z.string(),
  c_localidad: z.string(),
  localidad: z.string(),
  c_estado: z.string(),
  estado: z.string(),
  referencia: z.string(),
  // Crédito / Facturación
  metodo_de_pago: z.string(),
  metodo_de_pago_descr: z.string(),
  dias_credito: z.string(),
  limite_credito: z.string(),
  num_cta_pago: z.string(),
  lista_precios_id: z.string(),
  // Otros
  tipo_cliente_id: z.string(),
  cuenta_contable: z.string(),
  num_proveedor: z.string(),
  tax_id: z.string(),
  num_reg_id_trib: z.string(),
});
type ClienteFormValues = z.infer<typeof clienteSchema>;

const defaultValues: ClienteFormValues = {
  nombre: "", rfc: "", codigo_postal: "", regimen_fiscal_id: "", estatus: "A",
  calle: "", no_exterior: "", no_interior: "",
  c_colonia: "", colonia: "", c_municipio: "", municipio: "",
  c_localidad: "", localidad: "", c_estado: "", estado: "", referencia: "",
  metodo_de_pago: "", metodo_de_pago_descr: "",
  dias_credito: "0", limite_credito: "0.000000", num_cta_pago: "",
  lista_precios_id: "",
  tipo_cliente_id: "", cuenta_contable: "", num_proveedor: "",
  tax_id: "", num_reg_id_trib: "",
};

// ── Direccion schema ─────────────────────────────────────────────────────────
const direccionSchema = z.object({
  direccion_id: z.string().min(1, "ID requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  calle: z.string(),
  no_exterior: z.string(),
  no_interior: z.string(),
  codigo_postal: z.string(),
  c_colonia: z.string(),
  colonia: z.string(),
  c_municipio: z.string(),
  municipio: z.string(),
  c_localidad: z.string(),
  localidad: z.string(),
  c_estado: z.string(),
  estado: z.string(),
  referencia: z.string(),
  estatus: z.string(),
});
type DireccionFormValues = z.infer<typeof direccionSchema>;

const defaultDireccion: DireccionFormValues = {
  direccion_id: "", descripcion: "",
  calle: "", no_exterior: "", no_interior: "",
  codigo_postal: "",
  c_colonia: "", colonia: "", c_municipio: "", municipio: "",
  c_localidad: "", localidad: "", c_estado: "", estado: "", referencia: "",
  estatus: "A",
};

// ── Field wrapper ────────────────────────────────────────────────────────────
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
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function Section({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2 col-span-full">
      {title}
    </p>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({
  active,
  onChange,
}: {
  active: "generales" | "domicilios";
  onChange: (t: "generales" | "domicilios") => void;
}) {
  const tab = (id: typeof active, label: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={[
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        active === id
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
  return (
    <div className="flex border-b bg-background">
      {tab("generales", "Generales")}
      {tab("domicilios", "Domicilios")}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════════════════════════
export default function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "nuevo";

  const { state, loadOne, add, update, validateCP, searchDirecciones, saveDireccion } =
    useClientes();

  const { showError, showSuccess } = useSnackbar();
  const [tab, setTab] = useState<"generales" | "domicilios">("generales");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(!isNew);
  const [dirExpanded, setDirExpanded] = useState(false);

  // Dirección sheet state
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loadingDirs, setLoadingDirs] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDir, setEditingDir] = useState<Direccion | null>(null);
  const [validatingCP2, setValidatingCP2] = useState(false);

  // LOVs
  const { options: regimenOpts, loading: loadingRegimen } = useLov(
    LOV_REGIMEN,
    "regimen_fiscal_id",
    "regimen"
  );

  // Main form
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });
  const { register, handleSubmit, setValue, watch, reset, formState } = form;
  const errors = formState.errors;

  // Address form (in sheet)
  const dirForm = useForm<DireccionFormValues>({
    resolver: zodResolver(direccionSchema),
    defaultValues: defaultDireccion,
  });

  // ── Load existing cliente ──────────────────────────────────────────────────
  useEffect(() => {
    if (isNew) return;

    // Try reuse selected record if already loaded
    if (state.selected?.cliente_id === id) {
      populateForm(state.selected as unknown as ClienteFormValues);
      setLoadingRecord(false);
      return;
    }

    setLoadingRecord(true);
    loadOne(id!)
      .then(() => setLoadingRecord(false))
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Error al cargar cliente");
        setLoadingRecord(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Populate form when selected changes
  useEffect(() => {
    if (!isNew && state.selected?.cliente_id === id) {
      populateForm(state.selected as unknown as ClienteFormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selected]);

  function populateForm(d: Record<string, string | null>) {
    const str = (v: unknown) => (v == null ? "" : String(v));
    reset({
      nombre: str(d.nombre),
      rfc: str(d.rfc),
      codigo_postal: str(d.codigo_postal),
      regimen_fiscal_id: str(d.regimen_fiscal_id),
      estatus: str(d.estatus) || "A",
      calle: str(d.calle),
      no_exterior: str(d.no_exterior),
      no_interior: str(d.no_interior),
      c_colonia: str(d.c_colonia),
      colonia: str(d.colonia),
      c_municipio: str(d.c_municipio),
      municipio: str(d.municipio),
      c_localidad: str(d.c_localidad),
      localidad: str(d.localidad),
      c_estado: str(d.c_estado),
      estado: str(d.estado),
      referencia: str(d.referencia),
      metodo_de_pago: str(d.metodo_de_pago),
      metodo_de_pago_descr: str(d.metodo_de_pago_descr),
      dias_credito: str(d.dias_credito) || "0",
      limite_credito: str(d.limite_credito) || "0.000000",
      num_cta_pago: str(d.num_cta_pago),
      lista_precios_id: str(d.lista_precios_id),
      tipo_cliente_id: str(d.tipo_cliente_id),
      cuenta_contable: str(d.cuenta_contable),
      num_proveedor: str(d.num_proveedor),
      tax_id: str(d.tax_id),
      num_reg_id_trib: str(d.num_reg_id_trib),
    });
  }

  // ── Load addresses when switching to Domicilios tab ───────────────────────
  useEffect(() => {
    if (tab !== "domicilios" || isNew || !id) return;
    if (direcciones.length > 0) return; // already loaded
    setLoadingDirs(true);
    searchDirecciones(id)
      .then(setDirecciones)
      .catch(() => {})
      .finally(() => setLoadingDirs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

  // ── Validate CP (main form) ───────────────────────────────────────────────
  const [validatingCP, setValidatingCP] = useState(false);

  const handleValidateCP = async () => {
    const cp = watch("codigo_postal");
    if (!cp) return;
    setValidatingCP(true);
    try {
      const res = await validateCP(cp);
      setValue("c_estado", res.c_estado, { shouldDirty: true });
      setValue("estado", res.estado, { shouldDirty: true });
      setValue("c_municipio", res.c_municipio, { shouldDirty: true });
      setValue("municipio", res.municipio, { shouldDirty: true });
      setValue("c_localidad", res.c_localidad, { shouldDirty: true });
      setValue("localidad", res.localidad, { shouldDirty: true });
    } catch (e) {
      showError(e instanceof Error ? e.message : "CP inválido");
    } finally {
      setValidatingCP(false);
    }
  };

  // ── Submit main form ──────────────────────────────────────────────────────
  const onSubmit = async (values: ClienteFormValues) => {

    const payload: Record<string, string> = {
      ...values,
      pais: "MEX",
      tipo_cliente_deudor: "CLIENTE",
      corporativo_id: "",
      corporativo_nombre: "",
      corporativo_rfc: "",
      vendedor_id: "",
      vendedor_nombre: "",
    };

    try {
      if (isNew) {
        const { clienteId, msg } = await add(payload);
        showSuccess(msg);
        navigate(`/clientes/${clienteId}`, { replace: true });
      } else {
        const { msg } = await update(id!, payload);
        showSuccess(msg);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  // ── Open sheet for new/edit address ──────────────────────────────────────
  const openNewDir = () => {
    setEditingDir(null);
    dirForm.reset(defaultDireccion);
    setSheetOpen(true);
  };

  const openEditDir = (d: Direccion) => {
    setEditingDir(d);
    dirForm.reset({
      direccion_id: d.direccion_id,
      descripcion: d.descripcion,
      calle: d.calle ?? "",
      no_exterior: d.no_exterior ?? "",
      no_interior: d.no_interior ?? "",
      codigo_postal: d.codigo_postal ?? "",
      c_colonia: d.c_colonia ?? "",
      colonia: d.colonia ?? "",
      c_municipio: d.c_municipio ?? "",
      municipio: d.municipio ?? "",
      c_localidad: d.c_localidad ?? "",
      localidad: d.localidad ?? "",
      c_estado: d.c_estado ?? "",
      estado: d.estado ?? "",
      referencia: d.referencia ?? "",
      estatus: d.estatus ?? "A",
    });
    setSheetOpen(true);
  };

  // ── Validate CP inside address sheet ─────────────────────────────────────
  const handleValidateDirCP = async () => {
    const cp = dirForm.getValues("codigo_postal");
    if (!cp) return;
    setValidatingCP2(true);
    try {
      const res = await validateCP(cp);
      dirForm.setValue("c_estado", res.c_estado, { shouldDirty: true });
      dirForm.setValue("estado", res.estado, { shouldDirty: true });
      dirForm.setValue("c_municipio", res.c_municipio, { shouldDirty: true });
      dirForm.setValue("municipio", res.municipio, { shouldDirty: true });
      dirForm.setValue("c_localidad", res.c_localidad, { shouldDirty: true });
      dirForm.setValue("localidad", res.localidad, { shouldDirty: true });
    } catch (e) {
      showError(e instanceof Error ? e.message : "CP inválido");
    } finally {
      setValidatingCP2(false);
    }
  };

  // ── Submit address form ───────────────────────────────────────────────────
  const onDirSubmit = async (values: DireccionFormValues) => {
    try {
      const payload: Record<string, string> = {
        ...values,
        cliente_id: id!,
        pais: "MEX",
        ruta_id: "",
        ...(editingDir ? { update: "S" } : {}),
      };
      const res = await saveDireccion(payload);
      showSuccess(res.msg);
      // Refresh list
      setDirecciones((prev) => {
        const idx = prev.findIndex((d) => d.direccion_id === res.record.direccion_id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.record;
          return next;
        }
        return [...prev, res.record];
      });
      setTimeout(() => setSheetOpen(false), 800);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const regimenSelected = watch("regimen_fiscal_id");
  const estatusSelected = watch("estatus");

  if (loadingRecord) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Regresar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold flex-1 truncate">
          {isNew
            ? "Nuevo Cliente"
            : (state.selected?.nombre ?? `Cliente ${id}`)}
        </h1>
        {!isNew && state.selected?.estatus && (
          <Badge variant={state.selected.estatus === "A" ? "default" : "secondary"}>
            {state.selected.estatus === "A" ? "Activo" : "Inactivo"}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <TabBar active={tab} onChange={setTab} />

      {/* ── Tab: Generales ─────────────────────────────────────────────────── */}
      {tab === "generales" && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-auto">
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">

            <Section title="Identificación" />

            <Field label="Nombre / Razón social *" error={errors.nombre?.message}>
              <Input
                {...register("nombre")}
                className="h-9 text-sm"
                placeholder="Empresa S.A. de C.V."
              />
            </Field>

            <Field label="RFC *" error={errors.rfc?.message}>
              <Input
                {...register("rfc", {
                  onChange: (e) =>
                    setValue("rfc", e.target.value.toUpperCase(), { shouldDirty: true }),
                })}
                className="h-9 text-sm font-mono uppercase"
                placeholder="XAXX010101000"
                maxLength={13}
              />
            </Field>

            <Section title="Fiscal" />

            <Field label="Código Postal *" error={errors.codigo_postal?.message}>
              <div className="flex gap-1.5">
                <Input
                  {...register("codigo_postal")}
                  className="h-9 text-sm flex-1"
                  placeholder="06600"
                  maxLength={5}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  disabled={validatingCP}
                  onClick={handleValidateCP}
                >
                  {validatingCP ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>

            <Field label="Régimen fiscal *" error={errors.regimen_fiscal_id?.message}>
              <Select
                value={regimenSelected}
                onValueChange={(v) =>
                  setValue("regimen_fiscal_id", v, { shouldDirty: true, shouldValidate: true })
                }
                disabled={loadingRegimen}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingRegimen ? "Cargando..." : "Seleccionar"} />
                </SelectTrigger>
                <SelectContent>
                  {regimenOpts.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.value} — {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Estatus">
              <Select
                value={estatusSelected}
                onValueChange={(v) => setValue("estatus", v, { shouldDirty: true })}
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

            <button
              type="button"
              onClick={() => setDirExpanded((v) => !v)}
              className="col-span-full flex items-center gap-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {dirExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Dirección
            </button>

            {dirExpanded && (
              <>
                <Field label="Calle">
                  <Input {...register("calle")} className="h-9 text-sm" />
                </Field>
                <Field label="No. exterior">
                  <Input {...register("no_exterior")} className="h-9 text-sm" />
                </Field>
                <Field label="No. interior">
                  <Input {...register("no_interior")} className="h-9 text-sm" />
                </Field>
                <Field label="Colonia">
                  <Input {...register("colonia")} className="h-9 text-sm" />
                </Field>
                <Field label="Municipio">
                  <Input
                    {...register("municipio")}
                    className="h-9 text-sm bg-muted/30"
                    readOnly
                    placeholder="(auto desde CP)"
                  />
                </Field>
                <Field label="Estado">
                  <Input
                    {...register("estado")}
                    className="h-9 text-sm bg-muted/30"
                    readOnly
                    placeholder="(auto desde CP)"
                  />
                </Field>
                <Field label="Localidad">
                  <Input
                    {...register("localidad")}
                    className="h-9 text-sm bg-muted/30"
                    readOnly
                    placeholder="(auto desde CP)"
                  />
                </Field>
                <Field label="Referencia">
                  <Input {...register("referencia")} className="h-9 text-sm" />
                </Field>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 flex justify-end gap-2 px-4 py-3 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isNew ? "Crear cliente" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Tab: Domicilios ──────────────────────────────────────────────────── */}
      {tab === "domicilios" && (
        <div className="flex-1 overflow-auto">
          {isNew ? (
            <p className="p-6 text-sm text-muted-foreground">
              Guarda el cliente primero para gestionar domicilios.
            </p>
          ) : (
            <>
              <div className="flex justify-end px-4 py-3 border-b">
                <Button size="sm" onClick={openNewDir}>
                  <Plus className="h-4 w-4 mr-1" /> Nueva dirección
                </Button>
              </div>

              {loadingDirs && (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              )}

              {!loadingDirs && direcciones.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">Sin domicilios registrados.</p>
              )}

              <div className="divide-y">
                {direcciones.map((d) => (
                  <div
                    key={d.direccion_id}
                    className="flex items-start justify-between px-4 py-3 gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {d.descripcion}{" "}
                        <span className="text-xs text-muted-foreground font-mono">
                          ({d.direccion_id})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[d.calle, d.no_exterior && `#${d.no_exterior}`, d.colonia]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[d.codigo_postal, d.municipio, d.estado]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={d.estatus === "A" ? "default" : "secondary"} className="text-xs">
                        {d.estatus === "A" ? "Activa" : "Inactiva"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDir(d)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Direccion Sheet ───────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingDir ? `Editar: ${editingDir.descripcion}` : "Nueva dirección"}
            </SheetTitle>
          </SheetHeader>

          <form
            onSubmit={dirForm.handleSubmit(onDirSubmit)}
            className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3"
          >
            {!editingDir && (
              <Field
                label="ID de dirección *"
                error={dirForm.formState.errors.direccion_id?.message}
              >
                <Input
                  {...dirForm.register("direccion_id", {
                    onChange: (e) =>
                      dirForm.setValue(
                        "direccion_id",
                        e.target.value.toUpperCase().replace(/\s/g, "_"),
                        { shouldDirty: true }
                      ),
                  })}
                  className="h-9 text-sm font-mono uppercase"
                  placeholder="ENTREGA_1"
                />
              </Field>
            )}

            <Field
              label="Descripción *"
              error={dirForm.formState.errors.descripcion?.message}
            >
              <Input {...dirForm.register("descripcion")} className="h-9 text-sm" />
            </Field>

            <Field label="CP">
              <div className="flex gap-1.5">
                <Input
                  {...dirForm.register("codigo_postal")}
                  className="h-9 text-sm flex-1"
                  maxLength={5}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  disabled={validatingCP2}
                  onClick={handleValidateDirCP}
                >
                  {validatingCP2 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>

            <Field label="Calle">
              <Input {...dirForm.register("calle")} className="h-9 text-sm" />
            </Field>
            <Field label="No. exterior">
              <Input {...dirForm.register("no_exterior")} className="h-9 text-sm" />
            </Field>
            <Field label="No. interior">
              <Input {...dirForm.register("no_interior")} className="h-9 text-sm" />
            </Field>
            <Field label="Colonia">
              <Input {...dirForm.register("colonia")} className="h-9 text-sm" />
            </Field>
            <Field label="Municipio">
              <Input
                {...dirForm.register("municipio")}
                className="h-9 text-sm bg-muted/30"
                readOnly
              />
            </Field>
            <Field label="Estado">
              <Input
                {...dirForm.register("estado")}
                className="h-9 text-sm bg-muted/30"
                readOnly
              />
            </Field>
            <Field label="Referencia">
              <Input {...dirForm.register("referencia")} className="h-9 text-sm" />
            </Field>

            <Field label="Estatus">
              <Select
                value={dirForm.watch("estatus")}
                onValueChange={(v) =>
                  dirForm.setValue("estatus", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Activa</SelectItem>
                  <SelectItem value="I">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={dirForm.formState.isSubmitting}>
                {dirForm.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                Guardar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
