"use client";

import { useState } from "react";
import { Play, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useStats } from "@/hooks/use-stats";
import { FiltrosEvidenciasPanel } from "@/components/filtros/filtros-evidencias";
import { nombreDepartamento } from "@/lib/geo";
import { parseDivipol } from "@/lib/divipol";
import { fmtNum, fmtPct } from "@/lib/format";

export function StatsView() {
  const { filtros, setFiltros, limpiar } = useFiltrosUrl();
  const [calcular, setCalcular] = useState(false);
  const { data, isFetching, isError, error, refetch } = useStats(
    filtros,
    calcular,
  );

  const niveles = parseDivipol(filtros.divipol);
  const dep = nombreDepartamento(niveles.departamento);

  const panel = (
    <FiltrosEvidenciasPanel filtros={filtros} onChange={(c) => setFiltros(c)} />
  );

  const ejecutar = () => {
    setCalcular(true);
    refetch();
  };

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 hidden items-center justify-between md:flex">
            <h2 className="font-semibold">Filtros</h2>
            <Button variant="ghost" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
          </div>

          {/* Filtros en sheet para móvil */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                render={<Button variant="outline" className="w-full" />}
              >
                <SlidersHorizontal className="size-4" /> Ajustar filtros
              </SheetTrigger>
              <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{panel}</div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:block">{panel}</div>
        </div>

        <Button className="w-full" size="lg" onClick={ejecutar} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          Calcular conteo
        </Button>
        <p className="text-xs text-muted-foreground">
          {dep
            ? `Ámbito: ${dep}${niveles.municipio ? " · municipio seleccionado" : ""}.`
            : "Sin filtro geográfico se contará una muestra del total nacional. Filtra por departamento o municipio para conteos completos."}
        </p>
      </aside>

      <main className="min-w-0 space-y-4">
        {!calcular && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
            <Play className="size-8 opacity-40" />
            <p>Ajusta los filtros y presiona “Calcular conteo”.</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 py-12 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="font-medium text-destructive">Error al calcular</p>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message}
            </p>
          </div>
        )}

        {calcular && isFetching && !data && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {data.parcial && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Conteo <strong>parcial</strong>: se sumaron{" "}
                  {fmtNum(data.evidencias_contadas)} de{" "}
                  {fmtNum(data.total_disponible)} evidencias (tope de{" "}
                  {data.max_paginas} páginas). Filtra por municipio para un
                  conteo completo.
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Mesas (deduplicadas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums">
                    {fmtNum(data.mesas)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    de {fmtNum(data.evidencias_contadas)} evidencias contadas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total votos urna
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums">
                    {fmtNum(data.total_urna)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtNum(data.sufragantes)} sufragantes
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Votos por candidato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.candidatos.map((c) => {
                  const totalCand = data.candidatos.reduce(
                    (s, x) => s + x.votos,
                    0,
                  );
                  return (
                    <div key={c.titulo} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.titulo}</span>
                        <span className="tabular-nums">
                          {fmtNum(c.votos)}{" "}
                          <span className="text-muted-foreground">
                            ({fmtPct(c.votos, totalCand)})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${totalCand ? (c.votos / totalCand) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-sm">
                  <Agregado label="Blancos" valor={data.blancos} />
                  <Agregado label="Nulos" valor={data.nulos} />
                  <Agregado label="No marcados" valor={data.no_marcados} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Agregado({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-lg font-semibold tabular-nums">{fmtNum(valor)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
