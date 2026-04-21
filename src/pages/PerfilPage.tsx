import { Skeleton } from "@/components/ui/skeleton";
import EmpresaInfoCard from "@/components/perfil/EmpresaInfoCard";
import CambioContrasenaCard from "@/components/perfil/CambioContrasenaCard";
import CsdUploadCard from "@/components/perfil/CsdUploadCard";
import { useEmpresaForm } from "@/hooks/useEmpresaForm";
import { useCambioContrasenaForm } from "@/hooks/useCambioContrasenaForm";
import { useCsdForm } from "@/hooks/useCsdForm";

export default function PerfilPage() {
  const empresaForm = useEmpresaForm();
  const contrasenaForm = useCambioContrasenaForm();
  const csdForm = useCsdForm();

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="max-w-2xl mx-auto w-full p-4 space-y-6">
        {empresaForm.loading ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <>
            <EmpresaInfoCard form={empresaForm} />
            <CambioContrasenaCard form={contrasenaForm} />
            <CsdUploadCard form={csdForm} />
          </>
        )}
      </div>
    </div>
  );
}
