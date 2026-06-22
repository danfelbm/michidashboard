/**
 * Calcula el CONTEO NACIONAL deduplicado por mesa y lo escribe en
 * src/data/conteo-nacional.json. Recorre toda la API (per_page=1000).
 *
 * Regla de dedup: una evidencia por mesa → preferir 'aprobada' sobre
 * 'pendiente'; a igual jerarquía, la más reciente. Se descartan 'rechazada'.
 *
 * Uso:  npm run aggregate
 * Requiere MICHI_API_TOKEN y MICHI_API_BASE en .env.local (o en el entorno).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadEnv() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const BASE =
  process.env.MICHI_API_BASE ??
  "https://michi.movimientopactohistorico.co/api/v1";
const TOKEN = process.env.MICHI_API_TOKEN;
const PER_PAGE = 1000;
const CONCURRENCY = 6;
const MAX_REINTENTOS = 6;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

if (!TOKEN) {
  console.error("Falta MICHI_API_TOKEN");
  process.exit(1);
}

interface Resp {
  data: Array<{
    id: number;
    estado: string;
    created_at: string;
    geografia?: { divipol?: string | null; mesa?: { id?: number } | null };
    respuestas_formulario?: Array<{
      campo_alias: string;
      campo_titulo: string;
      valor: number | string | null;
      constantes?: { codigo_candidato?: string } | null;
    }>;
  }>;
  meta: { last_page: number; total: number };
}

interface MesaAcc {
  estado: string;
  created: string;
  cepeda: number;
  abelardo: number;
  otros: Map<string, number>;
  blanco: number;
  nulo: number;
  nomarc: number;
  suf: number;
  urna: number;
}

const RANK: Record<string, number> = { aprobada: 2, pendiente: 1 };
const mejor = (a: MesaAcc, b: MesaAcc): MesaAcc => {
  const ra = RANK[a.estado] ?? 1;
  const rb = RANK[b.estado] ?? 1;
  if (ra !== rb) return ra > rb ? a : b;
  return a.created > b.created ? a : b;
};

async function getPage(page: number): Promise<Resp> {
  for (let i = 0; i <= MAX_REINTENTOS; i++) {
    const res = await fetch(
      `${BASE}/evidencias-formato?per_page=${PER_PAGE}&page=${page}`,
      { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } },
    );
    if (res.ok) return res.json() as Promise<Resp>;
    if ((res.status === 429 || res.status >= 500) && i < MAX_REINTENTOS) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(ra ? ra * 1000 : Math.min(1000 * 2 ** i, 15000));
      continue;
    }
    throw new Error(`HTTP ${res.status} page ${page}`);
  }
  throw new Error(`Reintentos agotados page ${page}`);
}

const num = (v: number | string | null): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

function ingest(mapa: Map<string, MesaAcc>, data: Resp["data"]) {
  for (const e of data) {
    if (e.estado === "rechazada") continue;
    const g = e.geografia ?? {};
    const key = `${g.mesa?.id ?? g.divipol ?? e.id}`;
    const acc: MesaAcc = {
      estado: e.estado,
      created: e.created_at,
      cepeda: 0,
      abelardo: 0,
      otros: new Map(),
      blanco: 0,
      nulo: 0,
      nomarc: 0,
      suf: 0,
      urna: 0,
    };
    for (const r of e.respuestas_formulario ?? []) {
      const v = num(r.valor);
      const a = r.campo_alias;
      if (a === "votos_blanco") acc.blanco += v;
      else if (a === "votos_nulos") acc.nulo += v;
      else if (a === "votos_no_marcados") acc.nomarc += v;
      else if (a === "total_sufragantes") acc.suf = v;
      else if (a === "total_votos_urna") acc.urna = v;
      else if (a === "votos_cepeda") acc.cepeda += v;
      else if (a === "votos_abelardo") acc.abelardo += v;
      else if (
        r.constantes?.codigo_candidato &&
        !["996", "997", "998"].includes(r.constantes.codigo_candidato)
      ) {
        acc.otros.set(r.campo_titulo, (acc.otros.get(r.campo_titulo) ?? 0) + v);
      }
    }
    const prev = mapa.get(key);
    mapa.set(key, prev ? mejor(prev, acc) : acc);
  }
}

async function main() {
  const t0 = Date.now();
  const mapa = new Map<string, MesaAcc>();
  const first = await getPage(1);
  const last = first.meta.last_page;
  const total = first.meta.total;
  console.log(`Total evidencias: ${total} · páginas: ${last}`);
  ingest(mapa, first.data);

  let page = 2;
  while (page <= last) {
    const batch: number[] = [];
    for (let i = 0; i < CONCURRENCY && page <= last; i++) batch.push(page++);
    const res = await Promise.allSettled(batch.map(getPage));
    for (const r of res) {
      if (r.status === "fulfilled") ingest(mapa, r.value.data);
      else console.warn("  fallo:", (r.reason as Error)?.message);
    }
    process.stdout.write(
      `\r  ${Math.min(page - 1, last)}/${last} págs · ${mapa.size} mesas   `,
    );
    await sleep(120);
  }

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
    for (const [t, v] of m.otros) otros.set(t, (otros.get(t) ?? 0) + v);
  }

  const out = {
    generado_at: new Date().toISOString(),
    total_evidencias: total,
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

  const dest = join(process.cwd(), "src", "data", "conteo-nacional.json");
  writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(
    `\nListo en ${((Date.now() - t0) / 1000).toFixed(0)}s · ${out.mesas} mesas · Cepeda ${cepeda.toLocaleString("es")} · Abelardo ${abelardo.toLocaleString("es")}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
