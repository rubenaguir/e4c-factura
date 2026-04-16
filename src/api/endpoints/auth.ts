import { apiCall } from "@/api/client";

export interface SucursalOption {
  workspace: string;
  empresa_id: string;
  sucursal_id: string;
  empresa_nombre: string;
  sucursal_nombre: string;
  empresa_sucursal_id: string;
  descripcion: string;
}

export interface LoginResponse {
  success: boolean;
  session: string;
  workspace: string;
  usuario: string;
  empresa_id: string;
  sucursal_id: string;
}

export interface SearchSucursalesResponse {
  totalCount: number;
  record: SucursalOption[];
}

export function searchSucursalesUsuario(usuario: string, contrasena: string) {
  return apiCall<SearchSucursalesResponse>(
    "seguri:acceso:acceso_jwt:SearchSucursalesUsuario",
    { usuario_id: usuario, contrasena }
  );
}

export interface ValidateSessionResponse {
  success: boolean;
  session: string;
}

export function validateSession() {
  return apiCall<ValidateSessionResponse>("seguri:acceso:acceso_jwt:ValidateSession");
}

export function login(
  usuario: string,
  contrasena: string,
  workspace: string,
  empresa_id: string,
  sucursal_id: string
) {
  return apiCall<LoginResponse>("seguri:acceso:acceso_jwt:Login", {
    usuario,
    contrasena,
    workspace,
    empresa_id,
    sucursal: sucursal_id,
  });
}
