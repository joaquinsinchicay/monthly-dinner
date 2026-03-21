"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

export function AlertDialog({ open, title, description, onConfirm, onCancel, confirmLabel = "Confirmar", cancelLabel = "Cancelar" }: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
    }
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-on-surface/20 px-4 pb-4 pt-20 backdrop-blur-xs md:items-center">
      <div className="w-full max-w-sm rounded-[1.5rem] bg-surface-lowest p-6 shadow-card-md">
        <p className="font-display text-2xl text-on-surface">{title}</p>
        <p className="mt-3 text-sm text-secondary">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
          <Button ref={confirmRef} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
