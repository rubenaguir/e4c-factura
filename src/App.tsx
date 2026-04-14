import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import FacturasPage from "@/pages/FacturasPage";
import IngresosPage from "@/pages/IngresosPage";
import ClientesPage from "@/pages/ClientesPage";
import ClienteDetail from "@/pages/ClienteDetail";
import ProductosPage from "@/pages/ProductosPage";
import ProductoDetail from "@/pages/ProductoDetail";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/facturas" replace />;
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
      { index: true, element: <Navigate to="/facturas" replace /> },
      { path: "facturas", element: <FacturasPage /> },
      { path: "ingresos", element: <IngresosPage /> },
      { path: "clientes", element: <ClientesPage /> },
      { path: "clientes/nuevo", element: <ClienteDetail /> },
      { path: "clientes/:id", element: <ClienteDetail /> },
      { path: "productos", element: <ProductosPage /> },
      { path: "productos/nuevo", element: <ProductoDetail /> },
      { path: "productos/:id", element: <ProductoDetail /> },
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
