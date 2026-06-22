// Cliente server-side de la API de michi.
// SOLO se usa en Route Handlers / server components: el token nunca llega al navegador.
import "server-only";

const BASE =
  process.env.MICHI_API_BASE ??
  "https://michi.movimientopactohistorico.co/api/v1";
const TOKEN = process.env.MICHI_API_TOKEN;

export const PER_PAGE_MAX = 1000;

export class MichiApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "MichiApiError";
  }
}

/**
 * Hace un GET autenticado contra la API de michi.
 * @param path ruta relativa al base, ej: "/evidencias-formato"
 * @param params query params (se omiten los vacíos)
 */
export async function michiGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  init?: RequestInit,
): Promise<T> {
  if (!TOKEN) {
    throw new MichiApiError(
      "MICHI_API_TOKEN no está configurado en el servidor (.env.local).",
      500,
    );
  }

  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && `${value}` !== "") {
      url.searchParams.set(key, `${value}`);
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    // Datos en vivo: no cachear.
    cache: "no-store",
  });

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      /* respuesta no-JSON */
    }
    throw new MichiApiError(
      `La API de michi respondió ${res.status}`,
      res.status,
      body,
    );
  }

  return (await res.json()) as T;
}
