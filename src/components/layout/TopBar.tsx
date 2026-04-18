import { Download, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  /** Solo mobile: controla el drawer lateral */
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

function getInitials(usuario: string): string {
  return usuario.slice(0, 2).toUpperCase();
}

function UserMenu() {
  const { logout, usuario, empresaId, sucursalId, empresaNombre, sucursalNombre } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!usuario) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Perfil de usuario"
        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-semibold text-xs transition-colors"
      >
        {getInitials(usuario)}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-50 overflow-hidden">
          {/* Usuario */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500">Usuario</p>
            <p className="text-sm font-medium text-gray-900 truncate">{usuario}</p>
          </div>

          {/* Empresa / Sucursal */}
          {(empresaId || sucursalId) && (
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
              {empresaId && (
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="text-sm text-gray-900 truncate">{empresaNombre ?? empresaId}</p>
                </div>
              )}
              {sucursalId && (
                <div>
                  <p className="text-xs text-gray-500">Sucursal</p>
                  <p className="text-sm text-gray-900 truncate">{sucursalNombre ?? sucursalId}</p>
                </div>
              )}
            </div>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ mobileMenuOpen, onMobileMenuToggle }: TopBarProps) {
  const { canInstall, install } = usePwaInstall();

  return (
    <header className="h-14 brand-gradient flex items-center px-4 gap-3 shrink-0 shadow-sm">
      {/* Hamburguesa (solo mobile) */}
      <button
        className="md:hidden -ml-1 p-1 rounded text-white/80 hover:text-white"
        onClick={onMobileMenuToggle}
        aria-label="Menú"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center">
          <span className="text-white font-bold text-xs">E4</span>
        </div>
        <span className="font-semibold text-sm text-white">E4C Facturación</span>
      </div>

      <div className="flex-1" />

      {/* Instalar PWA */}
      {canInstall && (
        <Button variant="outline" size="sm" onClick={install} className="gap-1.5 border-white/40 text-white hover:bg-white/20 hover:text-white">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Instalar app</span>
        </Button>
      )}

      <UserMenu />
    </header>
  );
}
