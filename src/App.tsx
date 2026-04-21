import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import FacturasPage from "@/pages/FacturasPage";
import IngresosPage from "@/pages/IngresosPage";
import IngresoDetail from "@/pages/IngresoDetail";
import ClientesPage from "@/pages/ClientesPage";
import ClienteDetail from "@/pages/ClienteDetail";
import ProductosPage from "@/pages/ProductosPage";
import ProductoDetail from "@/pages/ProductoDetail";
import FacturaDetail from "@/pages/FacturaDetail";
import DashboardPage from "@/pages/DashboardPage";
import PerfilPage from "@/pages/PerfilPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const router = createHashRouter([
  {
    path: "/login",
    element: (
      <RedirectIfAuth>
        <LoginPage />
      </RedirectIfAuth>
    ),
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "facturas", element: <FacturasPage /> },
      { path: "facturas/nuevo", element: <FacturaDetail /> },
      { path: "facturas/:serie/:folio", element: <FacturaDetail /> },
      { path: "ingresos", element: <IngresosPage /> },
      { path: "ingresos/nuevo", element: <IngresoDetail /> },
      { path: "ingresos/:serie/:folio", element: <IngresoDetail /> },
      { path: "clientes", element: <ClientesPage /> },
      { path: "clientes/nuevo", element: <ClienteDetail /> },
      { path: "clientes/:id", element: <ClienteDetail /> },
      { path: "productos", element: <ProductosPage /> },
      { path: "productos/nuevo", element: <ProductoDetail /> },
      { path: "productos/:id", element: <ProductoDetail /> },
      { path: "perfil", element: <PerfilPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
