import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <Alert className="shadow-lg border-primary/30 bg-background pr-3">
        <AlertDescription className="flex items-center justify-between gap-3 text-sm">
          <span>Nueva versión disponible.</span>
          <Button
            size="sm"
            variant="default"
            className="shrink-0 gap-1.5"
            onClick={() => updateServiceWorker(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
