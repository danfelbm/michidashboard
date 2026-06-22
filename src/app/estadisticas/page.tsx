import { Suspense } from "react";
import { StatsView } from "@/components/stats-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Estadísticas de conteo</h1>
        <p className="text-sm text-muted-foreground">
          Suma de votos por candidato sobre el universo filtrado.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <StatsView />
      </Suspense>
    </div>
  );
}
