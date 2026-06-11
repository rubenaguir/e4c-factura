import { useState, useRef, useCallback, useEffect } from "react";
import type { ClienteIngresosLov, CuentaCobrar, IngresoDetalle } from "@/api/endpoints/ingresos";
import {
  searchClientesForIngresos,
  validateLovFieldClientesIngresos,
  searchCuentasBancariasCliente,
  searchCuentasCobrar,
} from "@/api/endpoints/ingresos";
import { useSnackbar } from "@/context/useSnackbar";

function todayIso() { return new Date().toISOString().slice(0, 10); }

function apiDateToIso(apiDate: string): string {
  const [d, m, y] = apiDate.split("/");
  if (!y) return todayIso();
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Aplicación de un ingreso a una factura (CxC). `importe` va en la moneda del pago. */
export interface Aplicacion {
  importe: string;
  tipoCambioPago: string;
}

/** ¿Se requiere capturar tipo_cambio_pago para esta factura dado el pago? */
export function needsTipoCambioPago(cuentaMoneda: string, monedaPago: string): boolean {
  return cuentaMoneda !== monedaPago && monedaPago === "MXN";
}

/** Importe a aplicar por defecto al seleccionar la factura, en la moneda del pago. */
function defaultImporte(cuenta: CuentaCobrar, monedaPago: string): string {
  if (monedaPago === "MXN") return parseFloat(cuenta.saldo_moneda_base || "0").toFixed(2);
  if (monedaPago === cuenta.moneda_id) return parseFloat(cuenta.saldo || "0").toFixed(2);
  return "";
}

function buildDescripcion(cuentas: CuentaCobrar[], aplicaciones: Record<string, Aplicacion>): string {
  let descr = "";
  for (const c of cuentas) {
    const ap = aplicaciones[c.num_cta_cobrar];
    if (!ap || parseFloat(ap.importe || "0") <= 0) continue;
    const ref = `${c.documento_serie}${c.documento_folio}`;
    descr += descr === ""
      ? `${c.documento_descr} ${ref}`
      : `, ${ref}`;
  }
  return descr === "" ? "" : `PAGO DE ${descr}`;
}

export function useIngresoForm() {
  const { showError } = useSnackbar();

  // Client
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteRfc, setClienteRfc] = useState("");
  const [clienteCP, setClienteCP] = useState("");
  const [clienteRegimen, setClienteRegimen] = useState("");
  const [loadingCliente, setLoadingCliente] = useState(false);

  // Client search autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ cliente_id: string; nombre: string; rfc: string }>>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const debRef = useRef<number | undefined>(undefined);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cuentas por cobrar + aplicaciones (multi-factura)
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaCobrar[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Record<string, Aplicacion>>({});
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  // Payment
  const [fechaPagoIso, setFechaPagoIso] = useState(todayIso);
  const [formaPagoId, setFormaPagoId] = useState("");
  const [formaPagoDescr, setFormaPagoDescr] = useState("");
  const [monedaId, setMonedaId] = useState("MXN");
  const [tipoCambio, setTipoCambio] = useState("1");
  const [importe, setImporte] = useState(""); // solo para poblar la vista readonly
  const [descripcion, setDescripcionRaw] = useState("");
  const [descripcionTouched, setDescripcionTouched] = useState(false);
  const [referencia, setReferencia] = useState("");
  const [noAutorizacion, setNoAutorizacion] = useState("");

  // Bank
  const [bancoId, setBancoId] = useState("");
  const [bancoDescr, setBancoDescr] = useState("");
  const [satCtaOri, setSatCtaOri] = useState("");
  const [satCtaDest, setSatCtaDest] = useState("");
  const [satBancoDest, setSatBancoDest] = useState("");
  const [satBancoDestDescr, setSatBancoDestDescr] = useState("");

  // Total a aplicar = suma de los importes por factura (moneda del pago)
  const importeTotal = Object.values(aplicaciones)
    .reduce((sum, ap) => sum + (parseFloat(ap.importe || "0") || 0), 0)
    .toFixed(2);

  // Auto-generar descripción a partir de las facturas seleccionadas (salvo edición manual)
  useEffect(() => {
    if (descripcionTouched) return;
    setDescripcionRaw(buildDescripcion(cuentasCobrar, aplicaciones));
  }, [cuentasCobrar, aplicaciones, descripcionTouched]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setDescripcion = useCallback((v: string) => {
    setDescripcionTouched(true);
    setDescripcionRaw(v);
  }, []);

  function populateFromIngreso(r: IngresoDetalle) {
    setClienteId(r.cliente_id);
    setClienteNombre(r.nombre);
    setClienteRfc(r.rfc);
    // fecha_pago: "DD/MM/YYYY HH:mm:ss" — take date part only
    setFechaPagoIso(apiDateToIso(r.fecha_pago.slice(0, 10)));
    setFormaPagoId(r.forma_pago);
    setFormaPagoDescr(r.forma_pago_descr);
    setMonedaId(r.moneda_id);
    setTipoCambio(r.tipo_cambio);
    setImporte(r.importe);
    setBancoId(r.banco_id);
    setBancoDescr(r.banco_descr);
    setSatCtaOri(r.sat_cta_ori ?? "");
    setSatCtaDest(r.sat_cta_dest ?? "");
    setSatBancoDest(r.sat_banco_dest ?? "");
    setSatBancoDestDescr(r.sat_banco_dest_descr ?? "");
  }

  const handleClienteSelected = useCallback(async (lov: ClienteIngresosLov) => {
    setClienteId(lov.cliente_id);
    setClienteNombre(lov.nombre);
    setClienteRfc(lov.rfc);
    setClienteCP(lov.codigo_postal);
    setClienteRegimen(lov.regimen_fiscal_id);

    setBancoId(lov.banco_id ?? "");
    setBancoDescr(lov.banco_descr ?? "");
    setSatCtaOri(lov.sat_cta_ori ?? "");
    setSatCtaDest(lov.sat_cta_dest ?? "");
    setSatBancoDest(lov.sat_banco_dest ?? "");
    setSatBancoDestDescr(lov.sat_banco_dest_descr ?? "");

    setLoadingCuentas(true);
    setCuentasCobrar([]);
    setAplicaciones({});
    setDescripcionTouched(false);

    const [bancosRes, cuentasRes] = await Promise.allSettled([
      searchCuentasBancariasCliente(lov.cliente_id),
      searchCuentasCobrar(lov.cliente_id),
    ]);

    if (bancosRes.status === "fulfilled" && bancosRes.value.records.length > 0) {
      setSatCtaOri(bancosRes.value.records[0].sat_cta_ori);
    }
    if (cuentasRes.status === "fulfilled") {
      setCuentasCobrar(cuentasRes.value.records);
    }
    setLoadingCuentas(false);
  }, []);

  const handleSearchQueryChange = (q: string) => {
    setSearchQuery(q);
    clearTimeout(debRef.current);
    if (!q.trim()) { setSearchResults([]); setShowDrop(false); return; }
    debRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchClientesForIngresos(q);
        setSearchResults(res.records ?? []);
        setShowDrop(true);
      } catch { setSearchResults([]); setShowDrop(true); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleSearchSelect = async (clienteIdVal: string) => {
    setShowDrop(false);
    setSearchQuery("");
    setLoadingCliente(true);
    try {
      const lov = await validateLovFieldClientesIngresos(clienteIdVal);
      await handleClienteSelected(lov);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingCliente(false);
    }
  };

  const clearCliente = () => {
    setClienteId(""); setClienteNombre(""); setClienteRfc("");
    setClienteCP(""); setClienteRegimen("");
    setCuentasCobrar([]); setAplicaciones({});
    setDescripcionTouched(false); setDescripcionRaw("");
  };

  // ── Multi-factura ──────────────────────────────────────────────────────
  const toggleCuenta = useCallback((numCtaCobrar: string) => {
    setAplicaciones(prev => {
      const next = { ...prev };
      if (next[numCtaCobrar]) {
        delete next[numCtaCobrar];
      } else {
        const cuenta = cuentasCobrar.find(c => c.num_cta_cobrar === numCtaCobrar);
        next[numCtaCobrar] = {
          importe: cuenta ? defaultImporte(cuenta, monedaId) : "",
          tipoCambioPago: "",
        };
      }
      return next;
    });
  }, [cuentasCobrar, monedaId]);

  const setAplicacionImporte = useCallback((numCtaCobrar: string, value: string) => {
    setAplicaciones(prev => prev[numCtaCobrar]
      ? { ...prev, [numCtaCobrar]: { ...prev[numCtaCobrar], importe: value } }
      : prev);
  }, []);

  const setAplicacionTipoCambioPago = useCallback((numCtaCobrar: string, value: string) => {
    setAplicaciones(prev => prev[numCtaCobrar]
      ? { ...prev, [numCtaCobrar]: { ...prev[numCtaCobrar], tipoCambioPago: value } }
      : prev);
  }, []);

  /** Cambiar la moneda del pago re-aplica el importe por defecto a las filas seleccionadas. */
  const changeMonedaPago = useCallback((nuevaMoneda: string) => {
    setMonedaId(nuevaMoneda);
    if (nuevaMoneda === "MXN") setTipoCambio("1");
    setAplicaciones(prev => {
      const next: Record<string, Aplicacion> = {};
      for (const num of Object.keys(prev)) {
        const cuenta = cuentasCobrar.find(c => c.num_cta_cobrar === num);
        next[num] = {
          importe: cuenta ? defaultImporte(cuenta, nuevaMoneda) : prev[num].importe,
          tipoCambioPago: "",
        };
      }
      return next;
    });
  }, [cuentasCobrar]);

  const validate = (): string | null => {
    if (!clienteId) return "Selecciona un cliente";
    const seleccionadas = Object.entries(aplicaciones);
    const conImporte = seleccionadas.filter(([, ap]) => parseFloat(ap.importe || "0") > 0);
    if (conImporte.length === 0) return "Selecciona al menos una factura con importe mayor a 0";
    if (!formaPagoId) return "Selecciona la forma de pago";
    if (monedaId !== "MXN" && (isNaN(parseFloat(tipoCambio)) || parseFloat(tipoCambio) <= 0))
      return "El tipo de cambio debe ser mayor a 0";

    for (const [num, ap] of conImporte) {
      const cuenta = cuentasCobrar.find(c => c.num_cta_cobrar === num);
      if (!cuenta) continue;
      const imp = parseFloat(ap.importe);
      const ref = `${cuenta.documento_serie}${cuenta.documento_folio}`;
      if (needsTipoCambioPago(cuenta.moneda_id, monedaId)) {
        const tcp = parseFloat(ap.tipoCambioPago);
        if (isNaN(tcp) || tcp <= 0) return `Captura el TC de pago para la factura ${ref}`;
      } else if (monedaId === cuenta.moneda_id) {
        if (imp > parseFloat(cuenta.saldo) + 0.005)
          return `El importe de ${ref} excede su saldo (${cuenta.saldo})`;
      } else if (monedaId === "MXN") {
        if (imp > parseFloat(cuenta.saldo_moneda_base) + 0.005)
          return `El importe de ${ref} excede su saldo (${cuenta.saldo_moneda_base})`;
      }
    }
    return null;
  };

  const reset = () => {
    setClienteId(""); setClienteNombre(""); setClienteRfc("");
    setClienteCP(""); setClienteRegimen(""); setLoadingCliente(false);
    setSearchQuery(""); setSearchResults([]); setShowDrop(false); setSearching(false);
    setCuentasCobrar([]); setAplicaciones({}); setLoadingCuentas(false);
    setFechaPagoIso(todayIso());
    setFormaPagoId(""); setFormaPagoDescr("");
    setMonedaId("MXN"); setTipoCambio("1");
    setImporte(""); setDescripcionRaw(""); setDescripcionTouched(false);
    setReferencia(""); setNoAutorizacion("");
    setBancoId(""); setBancoDescr("");
    setSatCtaOri(""); setSatCtaDest("");
    setSatBancoDest(""); setSatBancoDestDescr("");
  };

  return {
    // Client
    clienteId, clienteNombre, clienteRfc, clienteCP, clienteRegimen, loadingCliente,
    // Search
    searchQuery, searchResults, showDrop, setShowDrop, searching, searchContainerRef,
    // Cuentas / aplicaciones
    cuentasCobrar, aplicaciones, loadingCuentas, importeTotal,
    // Payment
    fechaPagoIso, setFechaPagoIso,
    formaPagoId, setFormaPagoId,
    formaPagoDescr, setFormaPagoDescr,
    monedaId, setMonedaId, changeMonedaPago,
    tipoCambio, setTipoCambio,
    importe, setImporte,
    descripcion, setDescripcion,
    referencia, setReferencia,
    noAutorizacion, setNoAutorizacion,
    // Bank
    bancoId, setBancoId,
    bancoDescr, setBancoDescr,
    satCtaOri, setSatCtaOri,
    satCtaDest, setSatCtaDest,
    satBancoDest, setSatBancoDest,
    satBancoDestDescr, setSatBancoDestDescr,
    // Actions
    populateFromIngreso,
    handleSearchQueryChange,
    handleSearchSelect,
    clearCliente,
    toggleCuenta,
    setAplicacionImporte,
    setAplicacionTipoCambioPago,
    validate,
    reset,
  };
}
