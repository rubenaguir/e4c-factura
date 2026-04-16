import { FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { openPdfBlob } from "@/lib/pdf";

export interface PdfSheetState {
  open: boolean;
  loading: boolean;
  error: string | null;
  blob: Blob | null;
  filename: string;
}

export const PDF_SHEET_CLOSED: PdfSheetState = {
  open: false,
  loading: false,
  error: null,
  blob: null,
  filename: "",
};

interface PdfSheetProps {
  state: PdfSheetState;
  onClose: () => void;
}

export function PdfSheet({ state, onClose }: PdfSheetProps) {
  const { open, loading, error, blob, filename } = state;

  const handleAbrir = () => {
    if (!blob) return;
    openPdfBlob(blob, filename, false);
  };

  const handleDescargar = () => {
    if (!blob) return;
    openPdfBlob(blob, filename, true);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-xl pb-safe-or-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            {filename || "Factura PDF"}
          </SheetTitle>
        </SheetHeader>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generando PDF…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}

        {/* Ready */}
        {!loading && !error && blob && (
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleAbrir}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir PDF
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={handleDescargar}
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
