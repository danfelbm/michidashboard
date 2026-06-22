"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type {
  Evidencia,
  EvidenciasResponse,
  FiltrosEvidencias,
} from "@/types/evidencia";

async function fetchEvidencias(
  filtros: FiltrosEvidencias,
): Promise<EvidenciasResponse> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v) params.set(k, `${v}`);
  }
  if (!params.has("per_page")) params.set("per_page", "20");

  const res = await fetch(`/api/evidencias?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} al cargar evidencias`);
  }
  return res.json();
}

export function useEvidencias(filtros: FiltrosEvidencias) {
  return useQuery({
    queryKey: ["evidencias", filtros],
    queryFn: () => fetchEvidencias(filtros),
    placeholderData: keepPreviousData,
  });
}

async function fetchEvidencia(id: number | string): Promise<Evidencia> {
  const res = await fetch(`/api/evidencias/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} al cargar la evidencia`);
  }
  const json = await res.json();
  return (json.data ?? json) as Evidencia;
}

export function useEvidencia(id: number | string | null) {
  return useQuery({
    queryKey: ["evidencia", id],
    queryFn: () => fetchEvidencia(id!),
    enabled: id !== null && id !== undefined,
  });
}
