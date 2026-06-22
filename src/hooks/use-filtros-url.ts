"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { FiltrosEvidencias } from "@/types/evidencia";

export const CLAVES_FILTRO = [
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

/**
 * Lee y escribe los filtros de evidencias en los query params de la URL.
 * Mantener el estado en la URL hace que cada vista sea compartible y
 * sobrevive a recargas.
 */
export function useFiltrosUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filtros: FiltrosEvidencias = {};
  for (const clave of CLAVES_FILTRO) {
    const v = searchParams.get(clave);
    if (v) filtros[clave] = v;
  }

  const setFiltros = useCallback(
    (cambios: Partial<FiltrosEvidencias>, opts?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === undefined || valor === null || valor === "") {
          params.delete(clave);
        } else {
          params.set(clave, `${valor}`);
        }
      }
      if (opts?.resetPage !== false && !("page" in cambios)) {
        params.delete("page");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const limpiar = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filtros, setFiltros, limpiar };
}
