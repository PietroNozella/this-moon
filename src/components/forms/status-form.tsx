"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { useLocalStore } from "@/components/local-store-provider";
import { entryStatuses } from "@/lib/validators/learning";

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
  const { updateEntryStatus } = useLocalStore();

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        updateEntryStatus(entryId, String(formData.get("status") ?? "new"));
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
      <Button type="submit" variant="secondary">
        Atualizar
      </Button>
    </form>
  );
}
