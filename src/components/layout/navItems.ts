import { LayoutDashboard, FileText, DollarSign, Users, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/facturas", label: "Facturas", icon: FileText },
  { to: "/ingresos", label: "Ingresos", icon: DollarSign },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/productos", label: "Productos", icon: Package },
];
