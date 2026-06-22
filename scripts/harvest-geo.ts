/**
 * Recorre la API de michi una sola vez y extrae el catálogo geográfico
 * (departamentos + municipios con sus códigos DIVIPOL) a src/data/geo-catalogo.json.
 *
 * Uso:  npm run harvest:geo
 * Requiere MICHI_API_TOKEN y MICHI_API_BASE en .env.local
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// --- Carga simple de .env.local ---
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
const PER_PAGE = 100;
const CONCURRENCY = 4;
const MAX_REINTENTOS = 6;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

if (!TOKEN) {
  console.error("Falta MICHI_API_TOKEN en .env.local");
  process.exit(1);
}

interface GeoNivel {
  codigo: string;
  nombre: string;
}
interface MunicipioCat extends GeoNivel {
  depto_codigo: string;
}

interface PageResponse {
  data: Array<{
    geografia?: {
      departamento?: { codigo?: string; nombre?: string } | null;
      municipio?: { codigo?: string; nombre?: string } | null;
    };
  }>;
  meta: { last_page: number; total: number };
}

async function getPage(page: number): Promise<PageResponse> {
  const url = `${BASE}/evidencias-formato?per_page=${PER_PAGE}&page=${page}`;
  for (let intento = 0; intento <= MAX_REINTENTOS; intento++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (res.ok) return res.json();
    // 429 (rate limit) o 5xx → backoff exponencial y reintentar.
    if ((res.status === 429 || res.status >= 500) && intento < MAX_REINTENTOS) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const espera = retryAfter
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** intento, 15000);
      await sleep(espera);
      continue;
    }
    throw new Error(`HTTP ${res.status} en page ${page}`);
  }
  throw new Error(`Agotados reintentos en page ${page}`);
}

async function main() {
  const departamentos = new Map<string, string>(); // codigo -> nombre
  const municipios = new Map<string, MunicipioCat>(); // depto+codigo -> cat

  console.log("Obteniendo primera página para conocer el total...");
  const first = await getPage(1);
  const lastPage: number = first.meta.last_page;
  const total: number = first.meta.total;
  console.log(`Total registros: ${total} · páginas: ${lastPage}`);

  const ingest = (data: PageResponse["data"]) => {
    for (const e of data) {
      const g = e.geografia ?? {};
      const dep = g.departamento;
      const mun = g.municipio;
      if (dep?.codigo) departamentos.set(dep.codigo, dep.nombre);
      if (mun?.codigo && dep?.codigo) {
        const key = `${dep.codigo}-${mun.codigo}`;
        if (!municipios.has(key)) {
          municipios.set(key, {
            depto_codigo: dep.codigo,
            codigo: mun.codigo,
            nombre: mun.nombre,
          });
        }
      }
    }
  };

  ingest(first.data);

  // Recorre el resto de páginas en lotes concurrentes.
  let page = 2;
  let done = 1;
  while (page <= lastPage) {
    const batch: number[] = [];
    for (let i = 0; i < CONCURRENCY && page <= lastPage; i++) batch.push(page++);
    const results = await Promise.allSettled(batch.map((p) => getPage(p)));
    for (const r of results) {
      if (r.status === "fulfilled") ingest(r.value.data);
      else console.warn("  fallo página:", r.reason?.message ?? r.reason);
    }
    done += batch.length;
    if (done % 40 === 0 || page > lastPage) {
      process.stdout.write(
        `\r  ${done}/${lastPage} páginas · ${departamentos.size} deptos · ${municipios.size} municipios   `,
      );
    }
    await sleep(150); // respiro entre lotes para no gatillar rate-limit
  }
  console.log("\nListo. Escribiendo catálogo...");

  const catalogo = {
    generado_at: new Date().toISOString(),
    total_evidencias: total,
    departamentos: [...departamentos.entries()]
      .map(([codigo, nombre]) => ({ codigo, nombre }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    municipios: [...municipios.values()].sort(
      (a, b) =>
        a.depto_codigo.localeCompare(b.depto_codigo) ||
        a.codigo.localeCompare(b.codigo),
    ),
  };

  const out = join(process.cwd(), "src", "data", "geo-catalogo.json");
  writeFileSync(out, JSON.stringify(catalogo, null, 2));
  console.log(
    `Catálogo guardado en ${out}: ${catalogo.departamentos.length} departamentos, ${catalogo.municipios.length} municipios.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
