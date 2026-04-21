import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCambioContrasenaForm } from "@/hooks/useCambioContrasenaForm";

type CambioContrasenaFormType = ReturnType<typeof useCambioContrasenaForm>;

interface CambioContrasenaCardProps {
  form: CambioContrasenaFormType;
}

export default function CambioContrasenaCard({ form }: CambioContrasenaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cambio de contraseña</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contraseña actual */}
        <div>
          <Label htmlFor="contrasenaAnterior">Contraseña actual</Label>
          <Input
            id="contrasenaAnterior"
            type="password"
            value={form.contrasenaAnterior}
            onChange={(e) => form.setContrasenaAnterior(e.target.value)}
          />
        </div>

        {/* Nueva contraseña */}
        <div>
          <Label htmlFor="contrasena">Nueva contraseña</Label>
          <Input
            id="contrasena"
            type="password"
            value={form.contrasena}
            onChange={(e) => form.setContrasena(e.target.value)}
          />
        </div>

        {/* Confirmar nueva contraseña */}
        <div>
          <Label htmlFor="contrasenaConfirm">Confirmar nueva</Label>
          <Input
            id="contrasenaConfirm"
            type="password"
            value={form.contrasenaConfirm}
            onChange={(e) => form.setContrasenaConfirm(e.target.value)}
          />
          {form.error && (
            <p className="text-sm text-destructive mt-1">{form.error}</p>
          )}
        </div>

        {/* Botón Actualizar */}
        <div className="pt-2">
          <Button
            onClick={form.submitUpdate}
            disabled={form.saving}
            className="w-full"
          >
            {form.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.saving ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
