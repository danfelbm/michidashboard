import { NextRequest, NextResponse } from "next/server";
import { michiGet, MichiApiError, PER_PAGE_MAX } from "@/lib/michi-api";
import type { EvidenciasResponse } from "@/types/evidencia";

// Proxy de la lista paginada de evidencias. Reenvía los filtros soportados.
const FILTROS_PERMITIDOS = [
  "divipol",
  "proceso_electoral_id",
  "formato_id",
  "cargo_id",
  "estado",
  "origen",
  "desde",
  "hasta",
  "page",
  "per_page",
] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const params: Record<string, string> = {};
  for (const key of FILTROS_PERMITIDOS) {
    const value = sp.get(key);
    if (value) params[key] = value;
  }

  // Respetar el máximo de la API.
  if (params.per_page) {
    const n = Math.min(Number(params.per_page) || 20, PER_PAGE_MAX);
    params.per_page = `${n}`;
  }

  try {
    const data = await michiGet<EvidenciasResponse>(
      "/evidencias-formato",
      params,
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleError(err);
  }
}

export function handleError(err: unknown) {
  if (err instanceof MichiApiError) {
    return NextResponse.json(
      { error: err.message, detail: err.body },
      { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: "Error inesperado al consultar la API." },
    { status: 500 },
  );
}
