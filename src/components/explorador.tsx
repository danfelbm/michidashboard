"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useEvidencias } from "@/hooks/use-evidencias";
import {
  FiltrosEvidenciasPanel,
  type OpcionFaceta,
} from "@/components/filtros/filtros-evidencias";
import { EvidenciasLista } from "@/components/evidencias-lista";
import { EvidenciaDetalle } from "@/components/evidencia-detalle";
import { Paginacion } from "@/components/paginacion";
import { nombreDepartamento } from "@/lib/geo";
import { parseDivipol } from "@/lib/divipol";
import type { Evidencia, FiltrosEvidencias } from "@/types/evidencia";

function contarFiltros(f: FiltrosEvidencias): number {
  return (
    ["divipol", "estado", "origen", "desde", "hasta", "proceso_electoral_id", "formato_id", "cargo_id"] as const
  ).filter((k) => f[k]).length;
}

export function Explorador() {
  const { filtros, setFiltros, limpiar } = useFiltrosUrl();
  const { data, isLoading, isError, error, isFetching } =
    useEvidencias(filtros);
  const [seleccionada, setSeleccionada] = useState<Evidencia | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);

  // Facetas derivadas dinámicamente de la página actual.
  const facetas = useMemo(() => {
    const proceso = new Map<string, string>();
    const formato = new Map<string, string>();
    const cargo = new Map<string, string>();
    for (const e of data?.data ?? []) {
      if (e.proceso_electoral)
        proceso.set(`${e.proceso_electoral.id}`, e.proceso_electoral.titulo);
      if (e.formato) formato.set(`${e.formato.id}`, e.formato.nombre);
      if (e.cargo) cargo.set(`${e.cargo.id}`, e.cargo.nombre);
    }
    const toOpc = (m: Map<string, string>): OpcionFaceta[] =>
      [...m.entries()].map(([id, label]) => ({ id, label }));
    return {
      proceso: toOpc(proceso),
      formato: toOpc(formato),
      cargo: toOpc(cargo),
    };
  }, [data]);

  const nFiltros = contarFiltros(filtros);

  const abrirDetalle = (e: Evidencia) => {
    setSeleccionada(e);
    setDetalleAbierto(true);
  };

  const panel = (
    <FiltrosEvidenciasPanel
      filtros={filtros}
      onChange={(c) => setFiltros(c)}
      facetas={facetas}
    />
  );

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      {/* Sidebar de filtros en desktop */}
      <aside className="hidden md:block">
        <div className="sticky top-20 space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Filtros</h2>
            {nFiltros > 0 && (
              <Button variant="ghost" size="sm" onClick={limpiar}>
                <X className="size-3.5" /> Limpiar
              </Button>
            )}
          </div>
          {panel}
        </div>
      </aside>

      <main className="min-w-0 space-y-4">
        {/* Barra superior móvil: botón filtros + chips */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={filtrosAbierto} onOpenChange={setFiltrosAbierto}>
            <SheetTrigger
              render={<Button variant="outline" size="sm" className="shrink-0" />}
            >
              <SlidersHorizontal className="size-4" /> Filtros
              {nFiltros > 0 && (
                <Badge className="ml-1 size-5 justify-center rounded-full p-0">
                  {nFiltros}
                </Badge>
              )}
            </SheetTrigger>
            <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-8">{panel}</div>
            </SheetContent>
          </Sheet>
          {nFiltros > 0 && (
            <Button variant="ghost" size="sm" onClick={limpiar}>
              <X className="size-3.5" /> Limpiar
            </Button>
          )}
        </div>

        {/* Chips de filtros activos */}
        {nFiltros > 0 && (
          <FiltrosActivos filtros={filtros} onClear={(k) => setFiltros({ [k]: "" })} />
        )}

        {isError ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 py-12 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="font-medium text-destructive">
              Error al cargar evidencias
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {(error as Error)?.message}
            </p>
          </div>
        ) : (
          <>
            <EvidenciasLista
              evidencias={data?.data ?? []}
              loading={isLoading || isFetching}
              onSelect={abrirDetalle}
            />
            <Paginacion
              meta={data?.meta}
              onPage={(page) => setFiltros({ page: `${page}` }, { resetPage: false })}
            />
          </>
        )}
      </main>

      <EvidenciaDetalle
        evidenciaPreview={seleccionada}
        open={detalleAbierto}
        onOpenChange={setDetalleAbierto}
      />
    </div>
  );
}

function FiltrosActivos({
  filtros,
  onClear,
}: {
  filtros: FiltrosEvidencias;
  onClear: (clave: keyof FiltrosEvidencias) => void;
}) {
  const chips: { clave: keyof FiltrosEvidencias; label: string }[] = [];
  if (filtros.divipol) {
    const niveles = parseDivipol(filtros.divipol);
    const dep = nombreDepartamento(niveles.departamento);
    chips.push({
      clave: "divipol",
      label: dep ? `Geo: ${dep} (${filtros.divipol})` : `DIVIPOL: ${filtros.divipol}`,
    });
  }
  if (filtros.estado) chips.push({ clave: "estado", label: `Estado: ${filtros.estado}` });
  if (filtros.origen) chips.push({ clave: "origen", label: `Origen: ${filtros.origen}` });
  if (filtros.desde) chips.push({ clave: "desde", label: `Desde: ${filtros.desde}` });
  if (filtros.hasta) chips.push({ clave: "hasta", label: `Hasta: ${filtros.hasta}` });

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Badge
          key={c.clave}
          variant="secondary"
          className="cursor-pointer gap-1"
          onClick={() => onClear(c.clave)}
        >
          {c.label}
          <X className="size-3" />
        </Badge>
      ))}
    </div>
  );
}
