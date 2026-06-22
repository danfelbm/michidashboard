"use client";

import { RefreshCw } from "lucide-react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function RecargarButton() {
  const queryClient = useQueryClient();
  const fetching = useIsFetching();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => queryClient.invalidateQueries()}
      disabled={fetching > 0}
    >
      <RefreshCw className={`size-4 ${fetching > 0 ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Recargar</span>
    </Button>
  );
}
