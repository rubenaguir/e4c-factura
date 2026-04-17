import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ClientesProvider } from "./context/ClientesContext.tsx";
import { ProductosProvider } from "./context/ProductosContext.tsx";
import { CatalogosProvider } from "./context/CatalogosContext.tsx";
import { FacturasProvider } from "./context/FacturasContext.tsx";
import { IngresosProvider } from "./context/IngresosContext.tsx";
import PwaUpdateBanner from "./components/PwaUpdateBanner.tsx";
import { SnackbarProvider } from "./context/SnackbarContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <SnackbarProvider>
        <CatalogosProvider>
          <ClientesProvider>
            <ProductosProvider>
              <FacturasProvider>
                <IngresosProvider>
                  <App />
                  <PwaUpdateBanner />
                </IngresosProvider>
              </FacturasProvider>
            </ProductosProvider>
          </ClientesProvider>
        </CatalogosProvider>
      </SnackbarProvider>
    </AuthProvider>
  </StrictMode>
);
