import { useState } from "react";
import { useSnackbar } from "@/context/useSnackbar";
import { uploadCertForFolios } from "@/api/endpoints/perfil";

export function useCsdForm() {
  const { showError, showSuccess } = useSnackbar();

  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [contrasena, setContrasena] = useState("");
  const [uploading, setUploading] = useState(false);

  async function submitUpload() {
    if (!cerFile || !keyFile) {
      showError("Archivos requeridos");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadCertForFolios(
        cerFile,
        keyFile,
        contrasena
      );

      setContrasena("");
      showSuccess(response.msg);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al cargar CSD");
    } finally {
      setUploading(false);
    }
  }

  return {
    cerFile,
    setCerFile,
    keyFile,
    setKeyFile,
    contrasena,
    setContrasena,
    uploading,
    submitUpload,
  };
}
