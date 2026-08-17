import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSnackbar } from "@/context/useSnackbar";
import type { useIngresoForm } from "@/hooks/useIngresoForm";

type IngresoForm = ReturnType<typeof useIngresoForm>;

interface PreselectState {
  clienteId?: string;
  serie?: string;
  folio?: string;
}

/**
 * Consume el `location.state` dejado por el botón "Aplicar Pago" de FacturasPage:
 * selecciona el cliente y, cuando cargan sus cuentas por cobrar, marca la factura
 * indicada. Debe invocarse en IngresoDetail DESPUÉS del efecto que resetea el
 * formulario en estado "nueva", para que el reset no pise la preselección.
 */
export function useIngresoPreselect(isNew: boolean, form: IngresoForm) {
  const location = useLocation();
  const { showError } = useSnackbar();
  const preselect = (location.state as PreselectState | null) ?? null;
  const clienteAppliedRef = useRef(false);
  const facturaAppliedRef = useRef(false);
  const facturaNotFoundNotifiedRef = useRef(false);

  useEffect(() => {
    if (!isNew || !preselect?.clienteId || clienteAppliedRef.current) return;
    clienteAppliedRef.current = true;
    form.handleSearchSelect(preselect.clienteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    if (!preselect?.serie || !preselect?.folio || facturaAppliedRef.current) return;
    if (form.loadingCuentas || form.cuentasCobrar.length === 0) return;

    const cuenta = form.cuentasCobrar.find(
      c => c.documento_serie === preselect.serie && c.documento_folio === preselect.folio
    );
    if (cuenta) {
      facturaAppliedRef.current = true;
      form.toggleCuenta(cuenta.num_cta_cobrar);
    } else if (!facturaNotFoundNotifiedRef.current) {
      facturaNotFoundNotifiedRef.current = true;
      showError(`No se encontró la factura ${preselect.serie}-${preselect.folio} pendiente de pago para este cliente.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cuentasCobrar, form.loadingCuentas]);
}
