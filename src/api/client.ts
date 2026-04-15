const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const XDEBUG_ENABLED = import.meta.env.VITE_XDEBUG_ENABLED === "true";

// Callback registrado por AuthContext para forzar logout global
let logoutHandler: (() => void) | null = null;

export function setLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

/**
 * Serializa params anidados en notación PHP bracket:
 *   conceptos[0][sku]=xxx
 *   precios[0][]=LISTA4 (array de arrays)
 */
function flattenParams(value: unknown, prefix: string, body: URLSearchParams): void {
  if (Array.isArray(value)) {
    value.forEach((item, idx) => {
      if (Array.isArray(item)) {
        // array de arrays → conceptos[0][precios][1][] = valor
        item.forEach((v) => body.append(`${prefix}[${idx}][]`, String(v ?? "")));
      } else if (typeof item === "object" && item !== null) {
        flattenParams(item, `${prefix}[${idx}]`, body);
      } else {
        body.append(`${prefix}[${idx}]`, String(item ?? ""));
      }
    });
  } else if (typeof value === "object" && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      flattenParams(v, `${prefix}[${k}]`, body);
    }
  } else {
    body.set(prefix, String(value ?? ""));
  }
}

export async function apiCall<T>(
  opReq: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const session = localStorage.getItem("sv3_session") ?? "";

  const body = new URLSearchParams();
  body.set("opReq", opReq);
  body.set("session", session);
  for (const [key, value] of Object.entries(params)) {
    flattenParams(value, key, body);
  }

  let url = API_BASE_URL;
  if (XDEBUG_ENABLED) {
    url += "?XDEBUG_SESSION_START=XDEBUG_ECLIPSE";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.success === false) {
    if (result.forceLogout === "S") {
      localStorage.removeItem("sv3_session");
      logoutHandler?.();
    }
    throw new Error(result.msg ?? result.Message ?? "Error desconocido");
  }

  return result as T;
}
