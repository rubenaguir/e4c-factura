import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ClientesProvider } from "./context/ClientesContext.tsx";
import { ProductosProvider } from "./context/ProductosContext.tsx";
import PwaUpdateBanner from "./components/PwaUpdateBanner.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ClientesProvider>
        <ProductosProvider>
          <App />
          <PwaUpdateBanner />
        </ProductosProvider>
      </ClientesProvider>
    </AuthProvider>
  </StrictMode>
);
