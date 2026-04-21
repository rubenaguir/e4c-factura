import { useState } from "react";
import { useSnackbar } from "@/context/useSnackbar";
import { cambioContrasena } from "@/api/endpoints/perfil";

export function useCambioContrasenaForm() {
  const { showError, showSuccess } = useSnackbar();

  const [contrasenaAnterior, setContrasenaAnterior] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [contrasenaConfirm, setContrasenaConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (contrasena !== contrasenaConfirm) {
      return "Las contraseñas no coinciden";
    }
    return null;
  }

  async function submitUpdate() {
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        contrasena_anterior: contrasenaAnterior,
        contrasena,
        contrasena_confirm: contrasenaConfirm,
      };

      const response = await cambioContrasena(payload);

      setContrasenaAnterior("");
      setContrasena("");
      setContrasenaConfirm("");
      setError(null);

      showSuccess(response.msg);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  return {
    contrasenaAnterior,
    setContrasenaAnterior,
    contrasena,
    setContrasena,
    contrasenaConfirm,
    setContrasenaConfirm,
    error,
    saving,
    submitUpdate,
  };
}
