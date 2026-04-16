import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { setLogoutHandler } from "@/api/client";
import { login as apiLogin, searchSucursalesUsuario, validateSession } from "@/api/endpoints/auth";
import type { SucursalOption } from "@/api/endpoints/auth";

export interface AuthState {
  token: string | null;
  workspace: string | null;
  empresaId: string | null;
  sucursalId: string | null;
  usuario: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  /** Paso 2: login definitivo con empresa/sucursal seleccionada */
  login: (usuario: string, contrasena: string, empresaId: string, sucursalId: string) => Promise<void>;
  logout: () => void;
  /** Paso 1: obtener sucursales disponibles para el usuario */
  getSucursales: (usuario: string, contrasena: string) => Promise<SucursalOption[]>;
}

export type AuthContextValue = AuthState & AuthActions;

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

function parseTokenPayload(token: string): Record<string, unknown> {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(b64));
}

function readSession(): AuthState {
  try {
    const raw = localStorage.getItem("sv3_session");
    if (!raw) return emptyState();
    const payload = parseTokenPayload(raw);
    // Descartar token ya expirado al arrancar
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("sv3_session");
      return emptyState();
    }
    return {
      token: raw,
      workspace: payload.workspace as string ?? null,
      empresaId: payload.empresa_id as string ?? null,
      sucursalId: payload.sucursal_id as string ?? null,
      usuario: payload.usuario as string ?? null,
      isAuthenticated: true,
    };
  } catch {
    return emptyState();
  }
}

function emptyState(): AuthState {
  return { token: null, workspace: null, empresaId: null, sucursalId: null, usuario: null, isAuthenticated: false };
}

/** Devuelve ms hasta el 80% del tiempo restante del token (mínimo 0). */
function refreshDelayMs(token: string): number {
  try {
    const payload = parseTokenPayload(token);
    if (typeof payload.exp !== "number") return 0;
    const remainingMs = payload.exp * 1000 - Date.now();
    return Math.max(0, remainingMs * 0.8);
  } catch {
    return 0;
  }
}

/** ms restantes hasta expiración del token. */
function remainingMs(token: string): number {
  try {
    const payload = parseTokenPayload(token);
    if (typeof payload.exp !== "number") return 0;
    return Math.max(0, payload.exp * 1000 - Date.now());
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(readSession);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guardamos las sucursales disponibles entre paso 1 y paso 2 del login
  const pendingData = useRef<{
    usuario: string;
    contrasena: string;
    sucursales: SucursalOption[];
  } | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem("sv3_session");
    pendingData.current = null;
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    setState(emptyState());
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  /** Guarda el token en localStorage + state y reprograma el timer de refresh. */
  const applyToken = useCallback((token: string) => {
    localStorage.setItem("sv3_session", token);

    if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
    const delay = refreshDelayMs(token);
    refreshTimerRef.current = setTimeout(doRefresh, delay);

    setState((prev) => ({ ...prev, token, isAuthenticated: true }));
  // doRefresh se define abajo; la referencia se resuelve en runtime, no en closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Llama a ValidateSession y aplica el nuevo token si tiene éxito. */
  const doRefresh = useCallback(async () => {
    try {
      const res = await validateSession();
      applyToken(res.session);
    } catch {
      // Si falla el refresh (red, token ya inválido) el usuario
      // continuará hasta que apiCall reciba forceLogout === "S".
    }
  }, [applyToken]);

  // Al montar con sesión existente, programar el primer refresh
  useEffect(() => {
    if (state.token && state.isAuthenticated) {
      if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
      const delay = refreshDelayMs(state.token);
      refreshTimerRef.current = setTimeout(doRefresh, delay);
    }
    return () => {
      if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
    };
  // Solo al montar: dependencias vacías intencionadas
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando el tab vuelve al frente, refrescar si quedan menos de 10 min
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const token = localStorage.getItem("sv3_session");
      if (!token) return;
      if (remainingMs(token) < 10 * 60 * 1000) {
        doRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [doRefresh]);

  const getSucursales = useCallback(
    async (usuario: string, contrasena: string): Promise<SucursalOption[]> => {
      const res = await searchSucursalesUsuario(usuario, contrasena);
      pendingData.current = { usuario, contrasena, sucursales: res.record };
      return res.record;
    },
    []
  );

  const login = useCallback(
    async (_usuario: string, _contrasena: string, empresaId: string, sucursalId: string) => {
      const { usuario, contrasena } = pendingData.current!;
      const workspace = 'default';
      const loginRes = await apiLogin(usuario, contrasena, workspace, empresaId, sucursalId);

      pendingData.current = null;
      applyToken(loginRes.session);

      setState((prev) => ({
        ...prev,
        workspace: loginRes.workspace ?? workspace,
        empresaId: loginRes.empresa_id ?? empresaId,
        sucursalId: loginRes.sucursal_id ?? sucursalId,
        usuario: loginRes.usuario ?? usuario,
        isAuthenticated: true,
      }));
    },
    [applyToken]
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getSucursales }}>
      {children}
    </AuthContext.Provider>
  );
}
