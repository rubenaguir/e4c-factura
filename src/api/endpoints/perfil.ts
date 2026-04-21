import { apiCall } from "@/api/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface EmpresaData {
  empresa_id: string;
  corporativo_id: string;
  esquema_facturacion: string;
  rfc: string;
  curp: string | null;
  nombre: string;
  nombre_comercial: string;
  calle: string;
  no_exterior: string;
  no_interior: string | null;
  colonia: string;
  localidad: string;
  referencia: string | null;
  municipio: string;
  estado: string;
  pais: string;
  codigo_postal: string;
  regimen_fiscal_id: string;
}

export interface UpdateBasicDataPayload {
  nombre_comercial: string;
  regimen_fiscal_id: string;
  calle: string;
  no_exterior: string;
  no_interior: string | null;
  colonia: string;
  localidad: string;
  municipio: string;
  estado: string;
  pais: string;
  codigo_postal: string;
}

export interface CambioContrasenaPayload {
  contrasena_anterior: string;
  contrasena: string;
  contrasena_confirm: string;
}

/** Carga los datos básicos de la empresa (sin envelope success) */
export function loadBasicData(): Promise<EmpresaData> {
  return apiCall<EmpresaData>("sistema:empresas:empresas:LoadBasicData");
}

/** Actualiza los datos básicos de la empresa */
export function updateBasicData(
  payload: UpdateBasicDataPayload
): Promise<{ msg: string; record: EmpresaData }> {
  return apiCall<{ msg: string; record: EmpresaData }>(
    "sistema:empresas:empresas:UpdateBasicData",
    payload as unknown as Record<string, string | number | boolean>
  );
}

/** Cambia la contraseña del usuario */
export function cambioContrasena(payload: Record<string, unknown>): Promise<{ msg: string }> {
  return apiCall<{ msg: string }>(
    "sistema:cambio_contrasena:cambio_contrasena:Update",
    payload
  );
}

/** Sube el certificado y llave privada para folios — usa fetch directo con FormData */
export async function uploadCertForFolios(
  cerFile: File,
  keyFile: File,
  contrasena: string
): Promise<{ msg: string }> {
  const session = localStorage.getItem("sv3_session") ?? "";

  const formData = new FormData();
  formData.append("opReq", "sistema:empresas:empresas:UploadCertForFolios");
  formData.append("session", session);
  formData.append("archivo_certificado", cerFile);
  formData.append("archivo_llave_privada", keyFile);
  formData.append("contrasena", contrasena);

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.success === false) {
    throw new Error(result.msg ?? result.Message ?? "Error desconocido");
  }

  return result as { msg: string };
}
