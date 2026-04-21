import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { navItems } from "./navItems";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout, usuario } = useAuth();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-200 shrink-0",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2 overflow-hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: usuario + perfil + logout */}
      <div className={cn("border-t px-2 py-3 space-y-1", collapsed && "flex flex-col items-center")}>
        {!collapsed && usuario && (
          <p className="text-xs text-muted-foreground px-2 truncate">{usuario}</p>
        )}
        <NavLink
          to="/perfil"
          title={collapsed ? "Perfil" : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
              collapsed ? "justify-center" : "",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Perfil</span>}
        </NavLink>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2 text-sm w-full transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-[calc(var(--sidebar-w)-12px)] z-10 h-6 w-6 rounded-full border bg-background shadow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        style={{ "--sidebar-w": collapsed ? "60px" : "240px" } as React.CSSProperties}
        title={collapsed ? "Expandir" : "Colapsar"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
