// @ts-nocheck
"use client";

import { useState } from "react";

import { updateAttendance } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Database } from "@/types";

type AttendanceStatus = Database["public"]["Tables"]["attendances"]["Row"]["status"];

const options: Array<{ value: AttendanceStatus; label: string; activeClassName: string }> = [
  { value: "va", label: "Voy", activeClassName: "attendance-chip-va" },
  { value: "tal_vez", label: "Tal vez", activeClassName: "attendance-chip-tal_vez" },
  { value: "no_va", label: "No voy", activeClassName: "attendance-chip-no_va" }
];

export function AttendanceChips({
  currentStatus,
  eventId,
  disabled = false,
  onUpdated
}: {
  currentStatus: AttendanceStatus | null;
  eventId: string;
  disabled?: boolean;
  onUpdated?: (nextStatus: AttendanceStatus) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(currentStatus);
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(nextStatus: AttendanceStatus): Promise<void> {
    setPendingStatus(nextStatus);
    setError(null);

    const result = await updateAttendance(eventId, nextStatus);
    setPendingStatus(null);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setSelectedStatus(result.data.status);
    onUpdated?.(result.data.status);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const active = selectedStatus === option.value;
          const pending = pendingStatus === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant="secondary"
              disabled={disabled || pendingStatus !== null}
              onClick={() => void handleClick(option.value)}
              className={cn("gap-2", active ? option.activeClassName : "")}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      {error ? <p className="rounded-2xl bg-error-cont px-4 py-3 text-sm text-error">{error}</p> : null}
    </div>
  );
}
