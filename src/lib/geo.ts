import catalogoRaw from "@/data/geo-catalogo.json";

export interface Departamento {
  codigo: string;
  nombre: string;
}
export interface Municipio {
  depto_codigo: string;
  codigo: string;
  nombre: string;
}

interface GeoCatalogo {
  generado_at: string | null;
  total_evidencias: number;
  departamentos: Departamento[];
  municipios: Municipio[];
}

const catalogo = catalogoRaw as GeoCatalogo;

export const departamentos: Departamento[] = [...catalogo.departamentos].sort(
  (a, b) => a.nombre.localeCompare(b.nombre, "es"),
);

const municipiosTodos = catalogo.municipios;

/** Municipios de un departamento, ordenados por nombre. */
export function municipiosDe(deptoCodigo: string | undefined): Municipio[] {
  if (!deptoCodigo) return [];
  return municipiosTodos
    .filter((m) => m.depto_codigo === deptoCodigo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function nombreDepartamento(codigo: string | undefined): string | null {
  if (!codigo) return null;
  return departamentos.find((d) => d.codigo === codigo)?.nombre ?? null;
}

export const catalogoGeneradoAt: string | null = catalogo.generado_at;
