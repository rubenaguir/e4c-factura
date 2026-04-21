import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmpresaForm } from "@/hooks/useEmpresaForm";

type EmpresaFormType = ReturnType<typeof useEmpresaForm>;

interface EmpresaInfoCardProps {
  form: EmpresaFormType;
}

export default function EmpresaInfoCard({ form }: EmpresaInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Información de la empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Razón social (readonly) */}
        <div>
          <Label htmlFor="nombre">Razón social</Label>
          <Input
            id="nombre"
            value={form.nombre}
            disabled
            className="bg-muted"
          />
        </div>

        {/* RFC (readonly) */}
        <div>
          <Label htmlFor="rfc">RFC</Label>
          <Input
            id="rfc"
            value={form.rfc}
            disabled
            className="bg-muted"
          />
        </div>

        {/* Nombre comercial */}
        <div>
          <Label htmlFor="nombreComercial">Nombre comercial</Label>
          <Input
            id="nombreComercial"
            value={form.nombreComercial}
            onChange={(e) => form.setNombreComercial(e.target.value)}
          />
        </div>

        {/* Régimen fiscal */}
        <div>
          <Label htmlFor="regimenFiscal">Régimen fiscal</Label>
          <Select
            value={form.regimenFiscalId}
            onValueChange={form.setRegimenFiscalId}
          >
            <SelectTrigger id="regimenFiscal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {form.regimenFiscalOptions.map((r) => (
                <SelectItem key={r.regimen_fiscal_id} value={r.regimen_fiscal_id}>
                  {r.regimen}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calle */}
        <div>
          <Label htmlFor="calle">Calle</Label>
          <Input
            id="calle"
            value={form.calle}
            onChange={(e) => form.setCalle(e.target.value)}
          />
        </div>

        {/* No. ext / int */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="noExterior">No. exterior</Label>
            <Input
              id="noExterior"
              value={form.noExterior}
              onChange={(e) => form.setNoExterior(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="noInterior">No. interior</Label>
            <Input
              id="noInterior"
              value={form.noInterior ?? ""}
              onChange={(e) =>
                form.setNoInterior(e.target.value || null)
              }
            />
          </div>
        </div>

        {/* Colonia */}
        <div>
          <Label htmlFor="colonia">Colonia</Label>
          <Input
            id="colonia"
            value={form.colonia}
            onChange={(e) => form.setColonia(e.target.value)}
          />
        </div>

        {/* Localidad */}
        <div>
          <Label htmlFor="localidad">Localidad</Label>
          <Input
            id="localidad"
            value={form.localidad}
            onChange={(e) => form.setLocalidad(e.target.value)}
          />
        </div>

        {/* Municipio */}
        <div>
          <Label htmlFor="municipio">Municipio</Label>
          <Input
            id="municipio"
            value={form.municipio}
            onChange={(e) => form.setMunicipio(e.target.value)}
          />
        </div>

        {/* Estado / País */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              value={form.estado}
              onChange={(e) => form.setEstado(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pais">País</Label>
            <Input
              id="pais"
              value={form.pais}
              onChange={(e) => form.setPais(e.target.value)}
            />
          </div>
        </div>

        {/* Código postal */}
        <div>
          <Label htmlFor="codigoPostal">Código postal</Label>
          <Input
            id="codigoPostal"
            value={form.codigoPostal}
            onChange={(e) => form.setCodigoPostal(e.target.value)}
          />
        </div>

        {/* Botón Guardar */}
        <div className="pt-2">
          <Button
            onClick={form.submitUpdate}
            disabled={form.saving}
            className="w-full"
          >
            {form.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.saving ? "Guardando..." : "Guardar datos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
