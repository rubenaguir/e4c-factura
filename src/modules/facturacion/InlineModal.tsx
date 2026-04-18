import React, { useEffect, useState } from "react";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!open || isDesktop) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kbh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kbh);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKeyboardHeight(0);
    };
  }, [open, isDesktop]);

  // Scroll focused input into view after keyboard animation completes
  useEffect(() => {
    if (!open || isDesktop) return;

    const handleFocusin = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") {
        setTimeout(() => t.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
      }
    };

    document.addEventListener("focusin", handleFocusin);
    return () => document.removeEventListener("focusin", handleFocusin);
  }, [open, isDesktop]);

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
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-lg"
        style={keyboardHeight > 0 ? { paddingBottom: `${keyboardHeight + 16}px` } : undefined}
      >
        <SheetHeader className="mb-4"><SheetTitle>{title}</SheetTitle></SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
