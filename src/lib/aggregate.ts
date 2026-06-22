// Lógica de agregación de votos con deduplicación por mesa.
// Compartida por el script de conteo nacional y el endpoint de stats filtrado.
//
// Regla de dedup (definida con el usuario): por cada mesa se conserva UNA
// evidencia → se prefiere 'aprobada' sobre 'pendiente'; a igual jerarquía,
// la más reciente (created_at). Las 'rechazada' se descartan.

import type { Evidencia } from "@/types/evidencia";
import { resumirVotos } from "@/lib/votos";

export interface MesaAcc {
  estado: string;
  created: string;
  cepeda: number;
  abelardo: number;
  otros: { titulo: string; votos: number }[];
  blanco: number;
  nulo: number;
  nomarc: number;
  suf: number;
  urna: number;
}

const RANK: Record<string, number> = { aprobada: 2, pendiente: 1 };

function mejor(a: MesaAcc, b: MesaAcc): MesaAcc {
  const ra = RANK[a.estado] ?? 1;
  const rb = RANK[b.estado] ?? 1;
  if (ra !== rb) return ra > rb ? a : b;
  return a.created > b.created ? a : b;
}

/** Clave estable de mesa: id de mesa o, en su defecto, el divipol completo. */
export function claveMesa(e: Evidencia): string {
  const g = e.geografia;
  return `${g.mesa?.id ?? g.divipol ?? e.id}`;
}

function aMesaAcc(e: Evidencia): MesaAcc {
  const r = resumirVotos(e);
  const cep = r.candidatos.find((c) => /cepeda/i.test(c.alias) || /cepeda/i.test(c.titulo));
  const abe = r.candidatos.find((c) => /abelardo/i.test(c.alias) || /abelardo/i.test(c.titulo));
  const otros = r.candidatos.filter((c) => c !== cep && c !== abe);
  return {
    estado: e.estado,
    created: e.created_at,
    cepeda: cep?.votos ?? 0,
    abelardo: abe?.votos ?? 0,
    otros: otros.map((o) => ({ titulo: o.titulo, votos: o.votos })),
    blanco: r.blancos,
    nulo: r.nulos,
    nomarc: r.noMarcados,
    suf: r.sufragantes ?? 0,
    urna: r.totalUrna ?? 0,
  };
}

/** Acumula un lote de evidencias en el mapa de mesas (dedup en sitio). */
export function acumularMesas(
  mapa: Map<string, MesaAcc>,
  evidencias: Evidencia[],
): void {
  for (const e of evidencias) {
    if (e.estado === "rechazada") continue;
    const key = claveMesa(e);
    const acc = aMesaAcc(e);
    const prev = mapa.get(key);
    mapa.set(key, prev ? mejor(prev, acc) : acc);
  }
}

export interface ConteoResultado {
  mesas: number;
  cepeda: number;
  abelardo: number;
  otros: { titulo: string; votos: number }[];
  blancos: number;
  nulos: number;
  no_marcados: number;
  sufragantes: number;
  total_urna: number;
}

/** Consolida el mapa de mesas en totales. */
export function finalizarConteo(mapa: Map<string, MesaAcc>): ConteoResultado {
  let cepeda = 0,
    abelardo = 0,
    blancos = 0,
    nulos = 0,
    no_marcados = 0,
    sufragantes = 0,
    total_urna = 0;
  const otros = new Map<string, number>();

  for (const m of mapa.values()) {
    cepeda += m.cepeda;
    abelardo += m.abelardo;
    blancos += m.blanco;
    nulos += m.nulo;
    no_marcados += m.nomarc;
    sufragantes += m.suf;
    total_urna += m.urna;
    for (const o of m.otros) otros.set(o.titulo, (otros.get(o.titulo) ?? 0) + o.votos);
  }

  return {
    mesas: mapa.size,
    cepeda,
    abelardo,
    otros: [...otros.entries()]
      .map(([titulo, votos]) => ({ titulo, votos }))
      .sort((a, b) => b.votos - a.votos),
    blancos,
    nulos,
    no_marcados,
    sufragantes,
    total_urna,
  };
}
