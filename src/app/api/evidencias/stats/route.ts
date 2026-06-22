import { NextRequest, NextResponse } from "next/server";
import { michiGet, PER_PAGE_MAX } from "@/lib/michi-api";
import { resumirVotos } from "@/lib/votos";
import type { EvidenciasResponse } from "@/types/evidencia";
import { handleError } from "../route";

// Máximo de páginas a recorrer por petición (cap anti-timeout).
// 60 páginas * 100 = 6.000 evidencias por consulta.
const MAX_PAGINAS = 60;

const FILTROS = [
  "divipol",
  "proceso_electoral_id",
  "formato_id",
  "cargo_id",
  "estado",
  "origen",
  "desde",
  "hasta",
] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const base: Record<string, string> = { per_page: `${PER_PAGE_MAX}` };
  for (const k of FILTROS) {
    const v = sp.get(k);
    if (v) base[k] = v;
  }

  try {
    // Acumuladores
    const candidatos = new Map<string, { titulo: string; votos: number }>();
    let blancos = 0;
    let nulos = 0;
    let noMarcados = 0;
    let sufragantes = 0;
    let totalUrna = 0;
    let evidenciasContadas = 0;

    const first = await michiGet<EvidenciasResponse>("/evidencias-formato", {
      ...base,
      page: 1,
    });
    const totalDisponible = first.meta.total;
    const ultimaPagina = Math.min(first.meta.last_page, MAX_PAGINAS);

    const acumular = (resp: EvidenciasResponse) => {
      for (const e of resp.data) {
        const r = resumirVotos(e);
        for (const c of r.candidatos) {
          const prev = candidatos.get(c.alias) ?? {
            titulo: c.titulo,
            votos: 0,
          };
          prev.votos += c.votos;
          candidatos.set(c.alias, prev);
        }
        blancos += r.blancos;
        nulos += r.nulos;
        noMarcados += r.noMarcados;
        sufragantes += r.sufragantes ?? 0;
        totalUrna += r.totalUrna ?? 0;
        evidenciasContadas++;
      }
    };

    acumular(first);

    for (let page = 2; page <= ultimaPagina; page++) {
      const resp = await michiGet<EvidenciasResponse>("/evidencias-formato", {
        ...base,
        page,
      });
      acumular(resp);
    }

    const parcial = first.meta.last_page > MAX_PAGINAS;

    return NextResponse.json({
      total_disponible: totalDisponible,
      evidencias_contadas: evidenciasContadas,
      parcial,
      max_paginas: MAX_PAGINAS,
      candidatos: [...candidatos.entries()]
        .map(([alias, v]) => ({ alias, ...v }))
        .sort((a, b) => b.votos - a.votos),
      blancos,
      nulos,
      no_marcados: noMarcados,
      sufragantes,
      total_urna: totalUrna,
    });
  } catch (err) {
    return handleError(err);
  }
}
