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

  // Cuentas por cobrar
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaCobrar[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaCobrar | null>(null);
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  // Payment
  const [fechaPagoIso, setFechaPagoIso] = useState(todayIso);
  const [formaPagoId, setFormaPagoId] = useState("");
  const [formaPagoDescr, setFormaPagoDescr] = useState("");
  const [monedaId, setMonedaId] = useState("MXN");
  const [tipoCambio, setTipoCambio] = useState("1");
  const [importe, setImporte] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [noAutorizacion, setNoAutorizacion] = useState("");

  // Bank
  const [bancoId, setBancoId] = useState("");
  const [bancoDescr, setBancoDescr] = useState("");
  const [satCtaOri, setSatCtaOri] = useState("");
  const [satCtaDest, setSatCtaDest] = useState("");
  const [satBancoDest, setSatBancoDest] = useState("");
  const [satBancoDestDescr, setSatBancoDestDescr] = useState("");

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
    setSelectedCuenta(null);
    setImporte("");

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
    setCuentasCobrar([]); setSelectedCuenta(null); setImporte("");
  };

  const handleCuentaSelect = (numCtaCobrar: string) => {
    const cuenta = cuentasCobrar.find(c => c.num_cta_cobrar === numCtaCobrar) ?? null;
    setSelectedCuenta(cuenta);
    if (cuenta) {
      setImporte(parseFloat(cuenta.saldo).toFixed(2));
      setMonedaId(cuenta.moneda_id);
      setDescripcion(prev => prev.trim() === ""
        ? `PAGO DE FACTURA ${cuenta.documento_serie}${cuenta.documento_folio}`
        : prev);
      setReferencia(prev => prev.trim() === ""
        ? `${cuenta.documento_serie}${cuenta.documento_folio}`
        : prev);
    }
  };

  const validate = (): string | null => {
    if (!clienteId) return "Selecciona un cliente";
    if (!selectedCuenta) return "Selecciona la factura a aplicar";
    const imp = parseFloat(importe);
    if (isNaN(imp) || imp <= 0) return "El importe debe ser mayor a 0";
    if (!formaPagoId) return "Selecciona la forma de pago";
    if (monedaId !== "MXN" && (isNaN(parseFloat(tipoCambio)) || parseFloat(tipoCambio) <= 0))
      return "El tipo de cambio debe ser mayor a 0";
    return null;
  };

  const reset = () => {
    setClienteId(""); setClienteNombre(""); setClienteRfc("");
    setClienteCP(""); setClienteRegimen(""); setLoadingCliente(false);
    setSearchQuery(""); setSearchResults([]); setShowDrop(false); setSearching(false);
    setCuentasCobrar([]); setSelectedCuenta(null); setLoadingCuentas(false);
    setFechaPagoIso(todayIso());
    setFormaPagoId(""); setFormaPagoDescr("");
    setMonedaId("MXN"); setTipoCambio("1");
    setImporte(""); setDescripcion(""); setReferencia(""); setNoAutorizacion("");
    setBancoId(""); setBancoDescr("");
    setSatCtaOri(""); setSatCtaDest("");
    setSatBancoDest(""); setSatBancoDestDescr("");
  };

  return {
    // Client
    clienteId, clienteNombre, clienteRfc, clienteCP, clienteRegimen, loadingCliente,
    // Search
    searchQuery, searchResults, showDrop, setShowDrop, searching, searchContainerRef,
    // Cuentas
    cuentasCobrar, selectedCuenta, loadingCuentas,
    // Payment
    fechaPagoIso, setFechaPagoIso,
    formaPagoId, setFormaPagoId,
    formaPagoDescr, setFormaPagoDescr,
    monedaId, setMonedaId,
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
    handleCuentaSelect,
    validate,
    reset,
  };
}
