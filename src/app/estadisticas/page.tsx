import { Suspense } from "react";
import { StatsView } from "@/components/stats-view";
import { ConteoNacional } from "@/components/conteo-nacional";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Estadísticas de conteo</h1>
        <p className="text-sm text-muted-foreground">
          Conteo nacional deduplicado por mesa y conteo por ámbito filtrado.
        </p>
      </div>

      <ConteoNacional />

      <div className="border-t pt-6">
        <h2 className="mb-1 text-lg font-semibold">Conteo por ámbito</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Suma de votos (dedup por mesa) sobre el universo que filtres.
        </p>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <StatsView />
        </Suspense>
      </div>
    </div>
  );
}
