import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSnackbar } from "@/context/useSnackbar";
import {
  loadBasicData,
  updateBasicData,
  type UpdateBasicDataPayload,
} from "@/api/endpoints/perfil";
import { loadRegimenFiscal, type RegimenFiscalRecord } from "@/api/endpoints/lovs";

export function useEmpresaForm() {
  const { empresaId } = useAuth();
  const { showError, showSuccess } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [rfc, setRfc] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [regimenFiscalId, setRegimenFiscalId] = useState("");
  const [calle, setCalle] = useState("");
  const [noExterior, setNoExterior] = useState("");
  const [noInterior, setNoInterior] = useState<string | null>(null);
  const [colonia, setColonia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");

  const [regimenFiscalOptions, setRegimenFiscalOptions] = useState<
    RegimenFiscalRecord[]
  >([]);

  useEffect(() => {
    Promise.all([loadBasicData(), loadRegimenFiscal()])
      .then(([data, regimenes]) => {
        setNombre(data.nombre);
        setRfc(data.rfc);
        setNombreComercial(data.nombre_comercial);
        setRegimenFiscalId(data.regimen_fiscal_id);
        setCalle(data.calle);
        setNoExterior(data.no_exterior);
        setNoInterior(data.no_interior);
        setColonia(data.colonia);
        setLocalidad(data.localidad);
        setMunicipio(data.municipio);
        setEstado(data.estado);
        setPais(data.pais);
        setCodigoPostal(data.codigo_postal);
        setRegimenFiscalOptions(regimenes);
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Error al cargar datos");
      })
      .finally(() => setLoading(false));
  }, [showError]);

  async function submitUpdate() {
    if (!empresaId) {
      showError("ID de empresa no disponible");
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateBasicDataPayload = {
        nombre_comercial: nombreComercial,
        regimen_fiscal_id: regimenFiscalId,
        calle,
        no_exterior: noExterior,
        no_interior: noInterior,
        colonia,
        localidad,
        municipio,
        estado,
        pais,
        codigo_postal: codigoPostal,
      };

      const response = await updateBasicData(empresaId, payload);

      setNombre(response.record.nombre);
      setRfc(response.record.rfc);
      setNombreComercial(response.record.nombre_comercial);
      setRegimenFiscalId(response.record.regimen_fiscal_id);
      setCalle(response.record.calle);
      setNoExterior(response.record.no_exterior);
      setNoInterior(response.record.no_interior);
      setColonia(response.record.colonia);
      setLocalidad(response.record.localidad);
      setMunicipio(response.record.municipio);
      setEstado(response.record.estado);
      setPais(response.record.pais);
      setCodigoPostal(response.record.codigo_postal);

      showSuccess(response.msg);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    saving,
    nombre,
    rfc,
    nombreComercial,
    setNombreComercial,
    regimenFiscalId,
    setRegimenFiscalId,
    calle,
    setCalle,
    noExterior,
    setNoExterior,
    noInterior,
    setNoInterior,
    colonia,
    setColonia,
    localidad,
    setLocalidad,
    municipio,
    setMunicipio,
    estado,
    setEstado,
    pais,
    setPais,
    codigoPostal,
    setCodigoPostal,
    regimenFiscalOptions,
    submitUpdate,
  };
}
