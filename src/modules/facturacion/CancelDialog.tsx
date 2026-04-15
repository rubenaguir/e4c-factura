import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOTIVOS = [
  { value: "01", label: "01 – Con relación" },
  { value: "02", label: "02 – Sin relación" },
  { value: "03", label: "03 – No se llevó a cabo" },
  { value: "04", label: "04 – Operación nominativa" },
];

export interface CancelDialogProps {
  open: boolean;
  serie: string;
  folio: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, folioSustituto: string) => void;
}

export function CancelDialog({ open, serie, folio, saving, onClose, onConfirm }: CancelDialogProps) {
  const [motivo, setMotivo] = useState("02");
  const [folioSustituto, setFolioSustituto] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Cancelar {serie}-{folio}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Motivo SAT</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOTIVOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {motivo === "01" && (
            <div className="space-y-1">
              <Label>Folio sustituto (serie-folio o UUID)</Label>
              <Input value={folioSustituto} onChange={e => setFolioSustituto(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="destructive" onClick={() => onConfirm(motivo, folioSustituto)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Solicitar cancelación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
