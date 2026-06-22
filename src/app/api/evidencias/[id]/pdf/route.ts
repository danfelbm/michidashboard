import { NextRequest, NextResponse } from "next/server";
import { michiGet } from "@/lib/michi-api";
import type { Evidencia } from "@/types/evidencia";
import { handleError } from "../../route";

// El endpoint /pdf de la API requiere URL firmada y la sirve como
// `Content-Disposition: attachment` (fuerza descarga). Aquí resolvemos el
// `pdf_url` firmado, traemos el PDF y lo reenviamos reescribiendo la cabecera
// a `inline` para poder visualizarlo embebido. Con ?download=1 se sirve como
// descarga.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const descargar = req.nextUrl.searchParams.get("download") === "1";

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

    const upstream = await fetch(evidencia.pdf_url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `No se pudo obtener el PDF (${upstream.status}).` },
        { status: upstream.status || 502 },
      );
    }

    const filename =
      evidencia.pdf_filename ?? `evidencia-${evidencia.id}.pdf`;

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `${descargar ? "attachment" : "inline"}; filename="${filename}"`,
    );
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    headers.set("Cache-Control", "private, max-age=300");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    return handleError(err);
  }
}
