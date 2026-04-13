import { Download, LogOut, Menu, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  /** Solo mobile: controla el drawer lateral */
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function TopBar({ mobileMenuOpen, onMobileMenuToggle }: TopBarProps) {
  const { canInstall, install } = usePwaInstall();
  const { logout, usuario } = useAuth();

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-3 shrink-0">
      {/* Hamburguesa (solo mobile) */}
      <button
        className="md:hidden -ml-1 p-1 rounded text-muted-foreground hover:text-foreground"
        onClick={onMobileMenuToggle}
        aria-label="Menú"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Logo mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">E4</span>
        </div>
        <span className="font-semibold text-sm">E4C Facturación</span>
      </div>

      <div className="flex-1" />

      {/* Instalar PWA */}
      {canInstall && (
        <Button variant="outline" size="sm" onClick={install} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Instalar app</span>
        </Button>
      )}

      {/* Usuario + logout (solo desktop, en mobile está en el drawer) */}
      {usuario && (
        <span className="hidden md:inline text-sm text-muted-foreground">{usuario}</span>
      )}
      <button
        onClick={logout}
        title="Cerrar sesión"
        className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  );
}
