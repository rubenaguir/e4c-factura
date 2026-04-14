import { apiCall } from "@/api/client";

const MODULE = "inventarios:catalogo_inventarios:catalogo_inventarios";

export interface ProductoRow {
  start: string;
  empresa_id: string;
  sku: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  caracteristicas: string | null;
  especificaciones: string | null;
  almacenable: string;              // "S" | "N"
  codigo_ean: string | null;
  composicion: string | null;
  costeo: string;                   // "PROMEDIO"
  unidad_id: string;                // "PZ"
  usa_lotes: string;                // "S" | "N"
  usa_series: string;               // "S" | "N"
  es_paquete: string;               // "S" | "N"
  estatus: string;                  // "A" | "I"
  esquema_impuestos_id: string;     // "GENERAL"
  actualizacion_usuario_id: string;
  actualizacion_fecha: string;      // "YYYY-MM-DD HH:mm:ss.xxxxxx"
  clave_prod_ser_sat: string | null;
  sat_cporte_peso_en_kg: string | null;
  mostrar_en_ecommerce: string;     // "S" | "N"
  categoria: string | null;
}

export interface ImpuestoEsquema {
  esquema_impuestos_id: string;
  region_id: string;
  aplicacion: string;               // "T" (traslado) | "R" (retención)
  num_impuesto: string;
  impuesto: string;                 // "IVA"
  tipo_factor: string | null;
  tasa: string;                     // "16.0000"
}

export interface ExistenciaNode {
  almacen_id?: string;
  descripcion: string | null;
  existencia: number | string;
  expanded: boolean | string;
  leaf?: string;
  children?: ExistenciaNode[];
}

export interface ProductoDetalle {
  sku: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  caracteristicas: string | null;
  especificaciones: string | null;
  almacenable: string;
  codigo_ean: string | null;
  composicion: string | null;
  clave_prod_ser_sat: string | null;
  clave_prod_ser_sat_desc: string | null;
  fraccion_arancelaria: string | null;
  costeo: string;
  unidad_id: string;
  es_paquete: string;
  es_perecedero: string;
  usa_lotes: string;
  usa_series: string;
  estatus: string;
  costo_promedio_mn: string;        // decimal como string
  esquema_impuestos_id: string;
  sat_cporte_peso_en_kg: string | null;
  categoria: string | null;
  mostrar_en_ecommerce: string;
  actualizacion_usuario_id: string;
  actualizacion_fecha: string;      // "DD/MM/YYYY HH:mm"
  categoria_contable_id: string;
  partes: unknown[];
  equivalentes: unknown[];
  unidades: unknown[];
  variantes: unknown[];
  grupo: unknown[];
  impuestos: ImpuestoEsquema[];
  clasificacion: unknown[];
  existencias: ExistenciaNode[];
  fotografia: string;
}

export interface ProductoSearchParams {
  sku?: string;
  codigo_ean?: string;
  clave_prod_ser_sat?: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  unidad_id?: string;
  clasificador_id?: string;
  usa_lotes?: string;
  usa_series?: string;
  almacenable?: string;
  estatus?: string;
  start?: number;
  limit?: number;
}

export function searchProductos(params: ProductoSearchParams) {
  return apiCall<{ totalCount: number; records: ProductoRow[] }>(
    `${MODULE}:Search`,
    params as Record<string, string | number | boolean>
  );
}

export function loadProducto(sku: string) {
  return apiCall<ProductoDetalle>(`${MODULE}:Load`, { sku });
}

export function addProducto(data: Record<string, string>) {
  return apiCall<{ msg: string; record: ProductoDetalle }>(`${MODULE}:Add`, data);
}

export function updateProducto(sku: string, data: Record<string, string>) {
  return apiCall<{ msg: string; record: ProductoDetalle }>(
    `${MODULE}:Update`,
    { sku, ...data }
  );
}
