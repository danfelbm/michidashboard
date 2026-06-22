// Utilidades para el slug DIVIPOL que usa la API de michi como filtro geográfico.
//
// Estructura del slug (por posición, según la doc de la API):
//   depto = 2 díg | municipio = 3 díg | zona = 2 díg | puesto = 2 díg | mesa = resto
// El filtro `divipol` de la API hace match parcial, por lo que construimos un
// prefijo acumulado a partir de los niveles seleccionados.

export interface NivelesGeo {
  departamento?: string; // código depto (2)
  municipio?: string; // código municipio (3)
  zona?: string; // código zona (2)
  puesto?: string; // código puesto (2)
  mesa?: string; // número de mesa
}

const ANCHOS = {
  departamento: 2,
  municipio: 3,
  zona: 2,
  puesto: 2,
} as const;

function pad(valor: string | undefined, ancho: number): string | null {
  if (!valor) return null;
  const limpio = valor.trim();
  if (!limpio) return null;
  // Solo rellenamos con ceros a la izquierda si es numérico y corto.
  if (/^\d+$/.test(limpio) && limpio.length < ancho) {
    return limpio.padStart(ancho, "0");
  }
  return limpio;
}

/** Construye el slug DIVIPOL (prefijo) a partir de los niveles seleccionados. */
export function buildDivipol(niveles: NivelesGeo): string {
  const depto = pad(niveles.departamento, ANCHOS.departamento);
  if (!depto) return "";
  let slug = depto;

  const muni = pad(niveles.municipio, ANCHOS.municipio);
  if (!muni) return slug;
  slug += muni;

  const zona = pad(niveles.zona, ANCHOS.zona);
  if (!zona) return slug;
  slug += zona;

  const puesto = pad(niveles.puesto, ANCHOS.puesto);
  if (!puesto) return slug;
  slug += puesto;

  const mesa = niveles.mesa?.trim();
  if (!mesa) return slug;
  slug += mesa;

  return slug;
}

/** Descompone un slug DIVIPOL en sus niveles (best-effort). */
export function parseDivipol(slug: string | null | undefined): NivelesGeo {
  if (!slug) return {};
  const s = slug.trim();
  return {
    departamento: s.slice(0, 2) || undefined,
    municipio: s.slice(2, 5) || undefined,
    zona: s.slice(5, 7) || undefined,
    puesto: s.slice(7, 9) || undefined,
    mesa: s.slice(9) || undefined,
  };
}
