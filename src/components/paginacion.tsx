"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtNum } from "@/lib/format";
import type { PaginationMeta } from "@/types/evidencia";

export function Paginacion({
  meta,
  onPage,
}: {
  meta: PaginationMeta | undefined;
  onPage: (page: number) => void;
}) {
  if (!meta) return null;
  const { current_page, last_page, total } = meta;

  return (
    <div className="flex flex-col items-center gap-3 py-2 sm:flex-row sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {fmtNum(total)} evidencias · página {fmtNum(current_page)} de{" "}
        {fmtNum(last_page)}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current_page <= 1}
          onClick={() => onPage(current_page - 1)}
        >
          <ChevronLeft className="size-4" /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={current_page >= last_page}
          onClick={() => onPage(current_page + 1)}
        >
          Siguiente <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
