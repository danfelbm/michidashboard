"use client";

import { useState } from "react";
import { Download, FileX, Eye, EyeOff, ExternalLink } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/estado-badge";
import { useEvidencia } from "@/hooks/use-evidencias";
import { resumirVotos } from "@/lib/votos";
import { fmtNum, fmtFecha, fmtPct } from "@/lib/format";
import type { Evidencia } from "@/types/evidencia";

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function EvidenciaDetalle({
  evidenciaPreview,
  open,
  onOpenChange,
}: {
  evidenciaPreview: Evidencia | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const id = evidenciaPreview?.id ?? null;
  const { data, isLoading } = useEvidencia(open ? id : null);
  // Usamos el detalle completo si llegó, o el preview de la lista.
  const e = data ?? evidenciaPreview;
  const [verPdf, setVerPdf] = useState(true);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2">
              <DrawerTitle className="font-mono">
                Evidencia #{e?.id}
              </DrawerTitle>
              {e && <EstadoBadge estado={e.estado} />}
            </div>
            <DrawerDescription>
              {e?.formato?.nombre} · {e?.cargo?.nombre} ·{" "}
              {e?.proceso_electoral?.titulo}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-6 px-4 pb-4">
            {!e ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <section className="grid grid-cols-2 gap-3 rounded-lg border p-4">
                  <Campo
                    label="Departamento"
                    value={e.geografia.departamento?.nombre}
                  />
                  <Campo
                    label="Municipio"
                    value={e.geografia.municipio?.nombre}
                  />
                  <Campo label="Zona" value={e.geografia.zona?.codigo} />
                  <Campo
                    label="Puesto"
                    value={e.geografia.puesto?.nombre}
                  />
                  <Campo label="Mesa" value={e.geografia.mesa?.numero} />
                  <Campo
                    label="DIVIPOL"
                    value={
                      <span className="font-mono text-xs">
                        {e.geografia.divipol}
                      </span>
                    }
                  />
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <Campo
                    label="Remitente"
                    value={e.remitente?.nombre}
                  />
                  <Campo label="Tipo" value={e.remitente?.tipo} />
                  <Campo label="Origen" value={e.origen} />
                  <Campo
                    label="Procesamiento"
                    value={e.estado_procesamiento}
                  />
                  <Campo label="Recibida" value={fmtFecha(e.created_at)} />
                  <Campo label="Revisada" value={fmtFecha(e.revisado_at)} />
                </section>

                <ResumenVotosBloque evidencia={e} />

                {e.pdf_url && (
                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Imagen del E-14</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVerPdf((v) => !v)}
                      >
                        {verPdf ? (
                          <>
                            <EyeOff className="size-4" /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="size-4" /> Ver
                          </>
                        )}
                      </Button>
                    </div>
                    {verPdf && (
                      <object
                        data={e.pdf_url}
                        type="application/pdf"
                        className="h-[60vh] w-full rounded-lg border bg-muted"
                      >
                        <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                          <p>
                            Tu navegador no puede mostrar el PDF aquí.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <a
                                href={e.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            <ExternalLink className="size-4" /> Abrir en una
                            pestaña
                          </Button>
                        </div>
                      </object>
                    )}
                  </section>
                )}

                {isLoading && (
                  <p className="text-center text-xs text-muted-foreground">
                    Cargando detalle completo…
                  </p>
                )}
              </>
            )}
          </div>

          <DrawerFooter>
            {e?.pdf_url ? (
              <Button
                className="w-full"
                render={
                  <a
                    href={`/api/evidencias/${e.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Download className="size-4" /> Descargar PDF firmado
              </Button>
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <FileX className="size-4" /> Sin PDF disponible
              </p>
            )}
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full">
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ResumenVotosBloque({ evidencia }: { evidencia: Evidencia }) {
  const r = resumirVotos(evidencia);
  const totalCandidatos = r.candidatos.reduce((s, c) => s + c.votos, 0);
  const base = r.totalUrna ?? totalCandidatos + r.blancos + r.nulos;

  if (r.candidatos.length === 0 && !r.totalUrna) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Votos registrados</h3>
      <div className="overflow-hidden rounded-lg border">
        {r.candidatos.map((c) => (
          <div
            key={c.alias}
            className="flex items-center justify-between border-b px-4 py-2.5 last:border-0"
          >
            <span className="text-sm">{c.titulo}</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">
                {fmtNum(c.votos)}
              </span>
              <span className="w-12 text-right text-xs text-muted-foreground">
                {fmtPct(c.votos, base)}
              </span>
            </span>
          </div>
        ))}
        <Fila label="Votos en blanco" valor={r.blancos} />
        <Fila label="Votos nulos" valor={r.nulos} />
        <Fila label="No marcados" valor={r.noMarcados} />
        {r.sufragantes !== null && (
          <Fila label="Total sufragantes" valor={r.sufragantes} fuerte />
        )}
        {r.totalUrna !== null && (
          <Fila label="Total votos urna" valor={r.totalUrna} fuerte />
        )}
      </div>
    </section>
  );
}

function Fila({
  label,
  valor,
  fuerte,
}: {
  label: string;
  valor: number;
  fuerte?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b px-4 py-2.5 last:border-0 ${
        fuerte ? "bg-muted/50 font-medium" : ""
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{fmtNum(valor)}</span>
    </div>
  );
}
