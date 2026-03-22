"use client";

import { useMemo, useState, useTransition } from "react";

import { createGroup } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_NAME_LENGTH = 60;

export function CreateGroupForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const characterCount = useMemo(() => name.length, [name]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre del grupo es obligatorio");
      return;
    }

    const formData = new FormData();
    formData.set("name", trimmedName);

    startTransition(async () => {
      const result = await createGroup(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="w-full max-w-md overflow-hidden shadow-card-md">
      <div className="bg-surface-low p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Onboarding</p>
        <h1 className="mt-3 font-display text-3xl text-on-surface">Crea tu grupo de cena</h1>
        <p className="mt-3 text-sm text-secondary">
          Define el nombre del grupo para desbloquear el dashboard y empezar a coordinar la próxima cena mensual.
        </p>
      </div>

      <form className="space-y-4 p-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="group-name">Nombre del grupo</Label>
            <span className="text-xs text-secondary">{characterCount} / {MAX_NAME_LENGTH}</span>
          </div>
          <Input
            id="group-name"
            name="name"
            type="text"
            maxLength={MAX_NAME_LENGTH}
            required
            placeholder="Ej: Cenas del Jueves"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "group-name-error" : undefined}
          />
        </div>

        {error ? (
          <p id="group-name-error" className="rounded-2xl bg-error-cont px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : null}
          {isPending ? "Creando..." : "Crear grupo"}
        </Button>

        <div className="rounded-2xl bg-surface-low p-4 text-sm text-secondary">
          Serás admin del grupo y luego podrás invitar al resto con un link único.
        </div>
      </form>
    </Card>
  );
}
