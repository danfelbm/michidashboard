"use client";

import { useQuery } from "@tanstack/react-query";
import type { FiltrosEvidencias } from "@/types/evidencia";

export interface StatsRespuesta {
  total_disponible: number;
  evidencias_contadas: number;
  parcial: boolean;
  max_paginas: number;
  candidatos: { alias: string; titulo: string; votos: number }[];
  blancos: number;
  nulos: number;
  no_marcados: number;
  sufragantes: number;
  total_urna: number;
}

async function fetchStats(filtros: FiltrosEvidencias): Promise<StatsRespuesta> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v && k !== "page" && k !== "per_page") params.set(k, `${v}`);
  }
  const res = await fetch(`/api/evidencias/stats?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} al calcular conteo`);
  }
  return res.json();
}

export function useStats(filtros: FiltrosEvidencias, enabled: boolean) {
  return useQuery({
    queryKey: ["stats", filtros],
    queryFn: () => fetchStats(filtros),
    enabled,
  });
}
