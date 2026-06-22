"use client";

import { MapPin, FileText, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/estado-badge";
import { fmtFecha } from "@/lib/format";
import type { Evidencia } from "@/types/evidencia";

function geoLinea(e: Evidencia): string {
  const g = e.geografia;
  return [g.departamento?.nombre, g.municipio?.nombre]
    .filter(Boolean)
    .join(" · ");
}

function geoDetalle(e: Evidencia): string {
  const g = e.geografia;
  return [
    g.zona && `Zona ${g.zona.codigo}`,
    g.puesto && `Puesto ${g.puesto.codigo}`,
    g.mesa && `Mesa ${g.mesa.numero}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function EvidenciasLista({
  evidencias,
  loading,
  onSelect,
}: {
  evidencias: Evidencia[];
  loading: boolean;
  onSelect: (e: Evidencia) => void;
}) {
  if (loading && evidencias.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (evidencias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        <FileText className="size-8 opacity-40" />
        <p>No hay evidencias para estos filtros.</p>
      </div>
    );
  }

  return (
    <div className={loading ? "opacity-60 transition-opacity" : ""}>
      {/* Móvil: cards apiladas */}
      <ul className="space-y-3 md:hidden">
        {evidencias.map((e) => (
          <li key={e.id}>
            <button
              onClick={() => onSelect(e)}
              className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent active:bg-accent"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{e.id}
                  </span>
                  <EstadoBadge estado={e.estado} />
                </div>
                <p className="flex items-center gap-1 truncate font-medium">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  {geoLinea(e) || "Sin ubicación"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {geoDetalle(e) || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.formato?.codigo} · {fmtFecha(e.created_at)}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Zona / Puesto / Mesa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Recibida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidencias.map((e) => (
              <TableRow
                key={e.id}
                onClick={() => onSelect(e)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono text-xs">#{e.id}</TableCell>
                <TableCell className="font-medium">
                  {geoLinea(e) || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {geoDetalle(e) || "—"}
                </TableCell>
                <TableCell>
                  <EstadoBadge estado={e.estado} />
                </TableCell>
                <TableCell className="text-sm capitalize">{e.origen}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtFecha(e.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
