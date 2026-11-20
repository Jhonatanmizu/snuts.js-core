import * as React from "react";

import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps): React.ReactElement | null {
  React.useEffect((): (() => void) => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={(): void => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed inset-x-0 top-[64px] z-50 border-b border-snuts-border bg-snuts-espresso p-5 shadow-2xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
