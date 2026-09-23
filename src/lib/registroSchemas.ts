import { z } from "zod";

// ---------------------------------------------------------------------------
// Validación cliente del alta self-service (§14 Paso 1 y Paso 2).
// Estos mensajes SÍ son locales: son validaciones que nunca llegan al backend
// (CLAUDE.md #9 aplica a los mensajes de negocio que devuelve el backend).
// ---------------------------------------------------------------------------

/** RFC persona moral (12) o física (13). */
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;

const CARACTERES_ESPECIALES = "!@#$%^&*()_+=[]{};:<>|./?,-";

export const datosFiscalesSchema = z.object({
  rfc: z
    .string()
    .trim()
    .min(1, "RFC requerido")
    .regex(RFC_REGEX, "RFC con formato inválido (12 o 13 caracteres)"),
  razon_social: z.string().trim().min(1, "Razón social requerida").max(255, "Máximo 255 caracteres"),
  regimen_fiscal: z.string().trim().min(1, "Selecciona un régimen fiscal"),
  codigo_postal: z.string().trim().regex(/^\d{5}$/, "Código postal de 5 dígitos"),
  calle: z.string().trim().max(255, "Máximo 255 caracteres"),
  no_exterior: z.string().trim().max(50, "Máximo 50 caracteres"),
  no_interior: z.string().trim().max(50, "Máximo 50 caracteres"),
  colonia: z.string().trim().max(255, "Máximo 255 caracteres"),
  municipio: z.string().trim().max(255, "Máximo 255 caracteres"),
  estado: z.string().trim().max(255, "Máximo 255 caracteres"),
  pais: z.literal("MEX"),
});

export type DatosFiscalesValues = z.infer<typeof datosFiscalesSchema>;

/**
 * Política de contraseña confirmada (§14 Paso 2): 8–72 caracteres, 1 mayúscula,
 * 1 minúscula, 1 dígito, 1 especial, sin espacios y distinta del RFC. Cada
 * regla tiene su propio mensaje — el spec prohíbe el genérico "contraseña inválida".
 */
const passwordSchema = z
  .string()
  .min(8, "Debe tener al menos 8 caracteres")
  .max(72, "No puede exceder 72 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/\d/, "Debe incluir al menos un dígito")
  .regex(/[!@#$%^&*()_+=[\]{};:<>|./?,-]/, `Debe incluir al menos un carácter especial (${CARACTERES_ESPECIALES})`)
  .refine((v) => !/\s/.test(v), "No debe contener espacios");

/** El requisito "distinta del RFC" obliga a construir el schema con el RFC ya capturado. */
export function cuentaAccesoSchema(rfc: string) {
  return z
    .object({
      email: z.string().trim().min(1, "Correo requerido").email("Correo con formato inválido"),
      password: passwordSchema,
      password_confirm: z.string().min(1, "Confirma la contraseña"),
    })
    .refine((v) => v.password.toUpperCase() !== rfc.trim().toUpperCase(), {
      path: ["password"],
      message: "La contraseña no puede ser igual al RFC",
    })
    .refine((v) => v.password === v.password_confirm, {
      path: ["password_confirm"],
      message: "Las contraseñas no coinciden",
    });
}

export type CuentaAccesoValues = z.infer<ReturnType<typeof cuentaAccesoSchema>>;

export const verificacionSchema = z.object({
  codigo: z.string().trim().regex(/^\d{6}$/, "El código es de 6 dígitos"),
  acepta_terminos: z.literal(true, { message: "Debes aceptar los términos y el aviso de privacidad" }),
});

/** Convierte el error de Zod en un mapa campo → primer mensaje. */
export function erroresPorCampo<T extends z.ZodType>(
  error: z.ZodError<z.infer<T>>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campo && !out[campo]) out[campo] = issue.message;
  }
  return out;
}
