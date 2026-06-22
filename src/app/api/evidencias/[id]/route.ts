import { NextRequest, NextResponse } from "next/server";
import { michiGet } from "@/lib/michi-api";
import type { Evidencia } from "@/types/evidencia";
import { handleError } from "../route";

// Proxy del detalle de una evidencia.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await michiGet<{ data: Evidencia } | Evidencia>(
      `/evidencias-formato/${encodeURIComponent(id)}`,
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleError(err);
  }
}
