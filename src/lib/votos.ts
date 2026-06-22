import type { Evidencia, RespuestaFormulario } from "@/types/evidencia";

export function numero(valor: RespuestaFormulario["valor"]): number {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") {
    const n = Number(valor.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Categoriza las respuestas de una evidencia en candidatos / agregados. */
export interface ResumenVotos {
  candidatos: { alias: string; titulo: string; votos: number }[];
  blancos: number;
  nulos: number;
  noMarcados: number;
  sufragantes: number | null;
  totalUrna: number | null;
}

const ALIAS_BLANCO = ["votos_blanco", "blancos"];
const ALIAS_NULO = ["votos_nulos", "nulos"];
const ALIAS_NO_MARCADO = ["votos_no_marcados", "no_marcados"];
const ALIAS_SUFRAGANTES = ["total_sufragantes", "sufragantes"];
const ALIAS_TOTAL_URNA = ["total_votos_urna"];

function esCandidato(r: RespuestaFormulario): boolean {
  // Un candidato tiene constantes con codigo_candidato "real" (no 996/997/998).
  const cod = r.constantes?.codigo_candidato;
  if (!cod) return false;
  return !["996", "997", "998"].includes(cod);
}

export function resumirVotos(evidencia: Evidencia): ResumenVotos {
  const respuestas = evidencia.respuestas_formulario ?? [];
  const candidatos: ResumenVotos["candidatos"] = [];
  let blancos = 0;
  let nulos = 0;
  let noMarcados = 0;
  let sufragantes: number | null = null;
  let totalUrna: number | null = null;

  for (const r of respuestas) {
    const alias = r.campo_alias ?? "";
    const v = numero(r.valor);
    if (ALIAS_BLANCO.includes(alias)) blancos += v;
    else if (ALIAS_NULO.includes(alias)) nulos += v;
    else if (ALIAS_NO_MARCADO.includes(alias)) noMarcados += v;
    else if (ALIAS_SUFRAGANTES.includes(alias)) sufragantes = v;
    else if (ALIAS_TOTAL_URNA.includes(alias)) totalUrna = v;
    else if (esCandidato(r))
      candidatos.push({ alias, titulo: r.campo_titulo, votos: v });
  }

  return { candidatos, blancos, nulos, noMarcados, sufragantes, totalUrna };
}
