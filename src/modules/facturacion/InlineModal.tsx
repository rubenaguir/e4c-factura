import React from "react";
import { useIsDesktop } from "./useIsDesktop";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

interface InlineModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Renderiza un Sheet (bottom) en mobile y un Dialog centrado en desktop.
 * Usar para formularios inline que no requieren navegación.
 */
export function InlineModal({ open, onClose, title, children, className }: InlineModalProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className={className ?? "sm:max-w-lg"}>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-lg">
        <SheetHeader className="mb-4"><SheetTitle>{title}</SheetTitle></SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
