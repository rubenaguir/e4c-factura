import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export interface MailDialogProps {
  open: boolean;
  serie: string;
  folio: string;
  receptorNombre: string;
  saving: boolean;
  sent: boolean;
  error: string | null;
  onClose: () => void;
  onSend: (nombre: string, correo: string, asunto: string) => void;
}

export function MailDialog({ open, serie, folio, receptorNombre, saving, sent, error, onClose, onSend }: MailDialogProps) {
  const [nombre, setNombre] = useState(receptorNombre);
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState(`Factura ${serie}-${folio}`);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Enviar {serie}-{folio}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {sent && <p className="text-sm text-green-600 font-medium">Correo enviado.</p>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} disabled={saving || sent} />
          </div>
          <div className="space-y-1">
            <Label>Correo</Label>
            <Input type="email" value={correo} onChange={e => setCorreo(e.target.value)} disabled={saving || sent} placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1">
            <Label>Asunto</Label>
            <Input value={asunto} onChange={e => setAsunto(e.target.value)} disabled={saving || sent} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cerrar</Button>
          <Button onClick={() => onSend(nombre, correo, asunto)} disabled={saving || sent || !correo}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
