import { NextRequest, NextResponse } from "next/server";
import { michiGet, PER_PAGE_MAX } from "@/lib/michi-api";
import {
  acumularMesas,
  finalizarConteo,
  type MesaAcc,
} from "@/lib/aggregate";
import type { EvidenciasResponse } from "@/types/evidencia";
import { handleError } from "../route";

// Conteo para un ámbito FILTRADO (p.ej. un municipio), con dedup por mesa.
// Con per_page=1000, 15 páginas cubren hasta 15.000 evidencias por consulta.
const MAX_PAGINAS = 15;

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
    const mapa = new Map<string, MesaAcc>();
    let evidenciasContadas = 0;

    const first = await michiGet<EvidenciasResponse>("/evidencias-formato", {
      ...base,
      page: 1,
    });
    const totalDisponible = first.meta.total;
    const ultimaPagina = Math.min(first.meta.last_page, MAX_PAGINAS);

    acumularMesas(mapa, first.data);
    evidenciasContadas += first.data.length;

    for (let page = 2; page <= ultimaPagina; page++) {
      const resp = await michiGet<EvidenciasResponse>("/evidencias-formato", {
        ...base,
        page,
      });
      acumularMesas(mapa, resp.data);
      evidenciasContadas += resp.data.length;
    }

    const conteo = finalizarConteo(mapa);
    const parcial = first.meta.last_page > MAX_PAGINAS;

    return NextResponse.json({
      total_disponible: totalDisponible,
      evidencias_contadas: evidenciasContadas,
      mesas: conteo.mesas,
      parcial,
      max_paginas: MAX_PAGINAS,
      candidatos: [
        { titulo: "Iván Cepeda", votos: conteo.cepeda },
        { titulo: "Abelardo de la Espriella", votos: conteo.abelardo },
        ...conteo.otros,
      ].sort((a, b) => b.votos - a.votos),
      blancos: conteo.blancos,
      nulos: conteo.nulos,
      no_marcados: conteo.no_marcados,
      sufragantes: conteo.sufragantes,
      total_urna: conteo.total_urna,
    });
  } catch (err) {
    return handleError(err);
  }
}
