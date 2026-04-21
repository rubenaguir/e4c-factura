import { useRef } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsdForm } from "@/hooks/useCsdForm";

type CsdFormType = ReturnType<typeof useCsdForm>;

interface CsdUploadCardProps {
  form: CsdFormType;
}

export default function CsdUploadCard({ form }: CsdUploadCardProps) {
  const cerInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Certificado de Sello Digital</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Certificado (.cer) */}
        <div>
          <Label htmlFor="cerFile">Certificado (.cer)</Label>
          <input
            ref={cerInputRef}
            type="file"
            accept=".cer"
            className="sr-only"
            onChange={(e) => form.setCerFile(e.target.files?.[0] ?? null)}
          />
          <Button
            variant="outline"
            onClick={() => cerInputRef.current?.click()}
            className="w-full mb-2"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Seleccionar archivo
          </Button>
          {form.cerFile && (
            <p className="text-sm text-muted-foreground">
              ✓ {form.cerFile.name}
            </p>
          )}
        </div>

        {/* Llave privada (.key) */}
        <div>
          <Label htmlFor="keyFile">Llave privada (.key)</Label>
          <input
            ref={keyInputRef}
            type="file"
            accept=".key"
            className="sr-only"
            onChange={(e) => form.setKeyFile(e.target.files?.[0] ?? null)}
          />
          <Button
            variant="outline"
            onClick={() => keyInputRef.current?.click()}
            className="w-full mb-2"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Seleccionar archivo
          </Button>
          {form.keyFile && (
            <p className="text-sm text-muted-foreground">
              ✓ {form.keyFile.name}
            </p>
          )}
        </div>

        {/* Contraseña de la llave privada */}
        <div>
          <Label htmlFor="contrasena">Contraseña de la llave privada</Label>
          <Input
            id="contrasena"
            type="password"
            value={form.contrasena}
            onChange={(e) => form.setContrasena(e.target.value)}
          />
        </div>

        {/* Botón Subir CSD */}
        <div className="pt-2">
          <Button
            onClick={form.submitUpload}
            disabled={
              form.uploading || !form.cerFile || !form.keyFile || !form.contrasena
            }
            className="w-full"
          >
            {form.uploading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {form.uploading ? "Subiendo..." : "Subir CSD"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
