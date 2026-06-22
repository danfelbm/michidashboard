import { NextRequest, NextResponse } from "next/server";
import { michiGet } from "@/lib/michi-api";
import type { Evidencia } from "@/types/evidencia";
import { handleError } from "../../route";

// El endpoint /pdf de la API requiere una URL firmada; el bearer no basta.
// La evidencia expone un `pdf_url` pre-firmado (con expiración). Aquí pedimos
// el detalle fresco para obtener ese enlace y redirigimos al PDF.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const json = await michiGet<{ data: Evidencia } | Evidencia>(
      `/evidencias-formato/${encodeURIComponent(id)}`,
    );
    const evidencia = ("data" in json ? json.data : json) as Evidencia;

    if (!evidencia.pdf_url) {
      return NextResponse.json(
        { error: "Esta evidencia no tiene PDF disponible." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(evidencia.pdf_url);
  } catch (err) {
    return handleError(err);
  }
}
