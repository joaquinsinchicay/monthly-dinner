"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm(): Promise<void> {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const firstAttempt = await supabase.auth.signOut();

    if (firstAttempt.error) {
      const fallbackAttempt = await supabase.auth.signOut({ scope: "global" });
      if (fallbackAttempt.error) {
        setError(fallbackAttempt.error.message);
        setLoading(false);
        setOpen(false);
        return;
      }
    }

    setLoading(false);
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" onClick={() => setOpen(true)} disabled={loading}>
        {loading ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>
      {error ? <p className="max-w-xs rounded-2xl bg-error-cont px-4 py-3 text-sm text-error">{error}</p> : null}
      <AlertDialog
        open={open}
        title="Cerrar sesión"
        description="Confirma para cerrar la sesión actual en este dispositivo."
        onCancel={() => setOpen(false)}
        onConfirm={() => { void handleConfirm(); }}
        confirmLabel="Sí, cerrar"
        cancelLabel="Seguir dentro"
      />
    </div>
  );
}
