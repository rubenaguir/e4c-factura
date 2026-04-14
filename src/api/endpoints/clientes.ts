import { apiCall } from "@/api/client";

const MODULE = "ventas:clientes:clientes";

export interface ClienteRow {
  empresa_id: string;
  cliente_id: string;
  corporativo_id: string;
  tipo_cliente_deudor: string;
  rfc: string;
  nombre: string;
  calle: string | null;
  no_exterior: string | null;
  no_interior: string | null;
  colonia: string | null;
  localidad: string | null;
  referencia: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string;
  codigo_postal: string | null;
  vendedor_id: string | null;
  tipo_cliente_id: string | null;
  regimen_fiscal_id: string | null;
  cuenta_contable: string | null;
  estatus: string;
  c_estado: string | null;
  c_municipio: string | null;
  c_colonia: string | null;
  c_localidad: string | null;
  actualizacion_fecha: string;
}

export interface Contacto {
  contacto_id: string;
  area: string | null;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  movil: string | null;
  fax: string | null;
  correo: string | null;
}

export interface ClienteDetalle extends ClienteRow {
  num_proveedor: string | null;
  tax_id: string | null;
  num_reg_id_trib: string | null;
  metodo_de_pago: string | null;
  metodo_de_pago_descr: string | null;
  lista_precios_id: string;
  vendedor_nombre: string | null;
  tipo_cliente_descr: string | null;
  num_cta_pago: string | null;
  dias_credito: string;
  limite_credito: string;
  contactos: Contacto[];
}

export interface Direccion {
  empresa_id: string;
  cliente_id: string;
  direccion_id: string;
  descripcion: string;
  calle: string | null;
  no_interior: string | null;
  no_exterior: string | null;
  colonia: string | null;
  localidad: string | null;
  referencia: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string;
  codigo_postal: string | null;
  estatus: string;
  c_estado: string | null;
  c_municipio: string | null;
  c_localidad: string | null;
  c_colonia: string | null;
  ruta_id: string | null;
  actualizacion_usuario_id: string;
  actualizacion_fecha: string;
  creacion_usuario_id: string;
  creacion_fecha: string;
}

export interface ValidateCPResponse {
  c_codigo_postal: string;
  c_estado: string;
  estado: string;
  c_municipio: string;
  municipio: string;
  c_localidad: string;
  localidad: string;
}

export interface ClienteSearchParams {
  cliente_id?: string;
  nombre?: string;
  rfc?: string;
  pais?: string;
  tipo_cliente_deudor?: string;
  tipo_cliente_id?: string;
  estatus?: string;
  start?: number;
  limit?: number;
}

export function searchClientes(params: ClienteSearchParams) {
  return apiCall<{ totalCount: number; records: ClienteRow[] }>(
    `${MODULE}:Search`,
    { tipo_cliente_deudor: "CLIENTE", ...params } as Record<string, string | number | boolean>
  );
}

export function loadCliente(clienteId: string) {
  return apiCall<ClienteDetalle>(`${MODULE}:Load`, { cliente_id: clienteId });
}

export function addCliente(data: Record<string, string>) {
  return apiCall<{ msg: string; record: ClienteDetalle }>(`${MODULE}:Add`, data);
}

export function updateCliente(clienteId: string, data: Record<string, string>) {
  return apiCall<{ msg: string; record: ClienteDetalle }>(
    `${MODULE}:Update`,
    { cliente_id: clienteId, ...data } as Record<string, string>
  );
}

export function validateCodigoPostal(cp: string) {
  return apiCall<ValidateCPResponse>(`${MODULE}:ValidateCodigoPostal`, {
    c_codigo_postal: cp,
  });
}

export function searchDirecciones(clienteId: string) {
  return apiCall<{ totalCount: number; records: Direccion[] }>(
    `${MODULE}:SearchDirecciones`,
    { cliente_id: clienteId }
  );
}

export function saveDireccion(data: Record<string, string>) {
  return apiCall<{ msg: string; record: Direccion }>(`${MODULE}:SaveDireccion`, data);
}
