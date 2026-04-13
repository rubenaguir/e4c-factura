import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { setLogoutHandler } from "@/api/client";
import { login as apiLogin, searchSucursalesUsuario } from "@/api/endpoints/auth";
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

function readSession(): AuthState {
  try {
    const raw = localStorage.getItem("sv3_session");
    if (!raw) return emptyState();
    // JWT payload (base64url decode del segundo segmento)
    const b64 = raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return {
      token: raw,
      workspace: payload.workspace ?? null,
      empresaId: payload.empresa_id ?? null,
      sucursalId: payload.sucursal_id ?? null,
      usuario: payload.usuario ?? null,
      isAuthenticated: true,
    };
  } catch {
    return emptyState();
  }
}

function emptyState(): AuthState {
  return { token: null, workspace: null, empresaId: null, sucursalId: null, usuario: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(readSession);

  // Guardamos las sucursales disponibles entre paso 1 y paso 2 del login
  const pendingData = useRef<{
    usuario: string;
    contrasena: string;
    sucursales: SucursalOption[];
  } | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem("sv3_session");
    pendingData.current = null;
    setState(emptyState());
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  const getSucursales = useCallback(
    async (usuario: string, contrasena: string): Promise<SucursalOption[]> => {
      const res = await searchSucursalesUsuario(usuario, contrasena);
      pendingData.current = { usuario, contrasena, sucursales: res.records };
      return res.records;
    },
    []
  );

  const login = useCallback(
    async (_usuario: string, _contrasena: string, empresaId: string, sucursalId: string) => {
      const { usuario, contrasena, sucursales } = pendingData.current!;

      // Obtener workspace de la sucursal seleccionada
      const sucursal = sucursales.find(
        (s) => s.empresa_id === empresaId && s.sucursal_id === sucursalId
      );
      const workspace = sucursal?.workspace ?? `${empresaId}_${sucursalId}`;

      const loginRes = await apiLogin(usuario, contrasena, workspace, empresaId, sucursalId);

      localStorage.setItem("sv3_session", loginRes.session);
      pendingData.current = null;

      setState({
        token: loginRes.session,
        workspace: loginRes.workspace ?? workspace,
        empresaId: loginRes.empresa_id ?? empresaId,
        sucursalId: loginRes.sucursal_id ?? sucursalId,
        usuario: loginRes.usuario ?? usuario,
        isAuthenticated: true,
      });
    },
    []
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getSucursales }}>
      {children}
    </AuthContext.Provider>
  );
}
