"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { entryStatuses } from "@/lib/validators/learning";
import { updateEntryStatus } from "@/server/actions/learning";

const labels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
};

export function StatusForm({
  entryId,
  currentStatus,
}: {
  entryId: string;
  currentStatus?: string | null;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const formData = new FormData(event.currentTarget);
        await updateEntryStatus(entryId, String(formData.get("status") ?? "new"));
        setPending(false);
      }}
    >
      <Select
        name="status"
        aria-label="Status"
        defaultValue={currentStatus ?? "new"}
        className="max-w-48"
      >
        {entryStatuses.map((status) => (
          <option key={status} value={status}>
            {labels[status]}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" disabled={pending}>
        Atualizar
      </Button>
    </form>
  );
}
