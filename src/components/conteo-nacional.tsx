"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtNum, fmtPct, fmtFecha } from "@/lib/format";

interface Conteo {
  generado_at: string | null;
  total_evidencias: number;
  mesas: number;
  cepeda: number;
  abelardo: number;
  otros: { titulo: string; votos: number }[];
  blancos: number;
  nulos: number;
  no_marcados: number;
  sufragantes: number;
  total_urna: number;
  fuente?: string;
}

async function fetchConteo(): Promise<Conteo> {
  const res = await fetch("/api/conteo-nacional");
  if (!res.ok) throw new Error("No se pudo cargar el conteo nacional");
  return res.json();
}

export function ConteoNacional() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["conteo-nacional"],
    queryFn: fetchConteo,
    staleTime: 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data || !data.generado_at) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aún no se ha calculado el conteo nacional. Ejecuta{" "}
          <code className="font-mono">npm run aggregate</code> (o espera al
          refresco automático).
        </CardContent>
      </Card>
    );
  }

  const lider =
    data.cepeda === data.abelardo
      ? null
      : data.cepeda > data.abelardo
        ? "Iván Cepeda"
        : "Abelardo de la Espriella";
  const totalCand =
    data.cepeda + data.abelardo + data.otros.reduce((s, o) => s + o.votos, 0);

  const candidatos = [
    { titulo: "Iván Cepeda", votos: data.cepeda },
    { titulo: "Abelardo de la Espriella", votos: data.abelardo },
    ...data.otros,
  ].sort((a, b) => b.votos - a.votos);

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            Conteo Nacional
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmtNum(data.mesas)} mesas · {fmtNum(data.total_evidencias)}{" "}
            evidencias · actualizado {fmtFecha(data.generado_at)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {candidatos.map((c) => (
            <div key={c.titulo} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  {lider === c.titulo && (
                    <Trophy className="size-4 text-amber-500" />
                  )}
                  {c.titulo}
                </span>
                <span className="tabular-nums">
                  <strong>{fmtNum(c.votos)}</strong>{" "}
                  <span className="text-muted-foreground">
                    ({fmtPct(c.votos, totalCand)})
                  </span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    lider === c.titulo ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{
                    width: `${totalCand ? (c.votos / totalCand) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Total urna" valor={data.total_urna} />
          <Mini label="Sufragantes" valor={data.sufragantes} />
          <Mini label="Blancos" valor={data.blancos} />
          <Mini label="Nulos" valor={data.nulos} />
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-lg font-semibold tabular-nums">{fmtNum(valor)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
