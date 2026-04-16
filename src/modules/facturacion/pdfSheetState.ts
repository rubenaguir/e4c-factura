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
