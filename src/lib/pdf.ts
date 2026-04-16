/**
 * Abre o descarga un Blob PDF creando un Object URL temporal.
 *
 * Comportamiento por plataforma:
 *  - Desktop/Android Chrome: abre en nueva pestaña o descarga según `download`.
 *  - iOS Safari (PWA y browser): el atributo `download` es ignorado; el PDF se
 *    abre en el viewer nativo de Safari (desde donde el usuario puede
 *    compartir / guardar a Archivos).
 */
export function openPdfBlob(blob: Blob, filename: string, download = false): void {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (download) {
    a.download = filename;
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Liberar memoria después de que el browser haya tenido tiempo de leer el blob
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
