import { NextResponse } from "next/server";
import snapshot from "@/data/conteo-nacional.json";

// El conteo nacional dedupeado lo calcula `npm run aggregate` (pesado, ~3 min)
// y se commitea en src/data/conteo-nacional.json. Aquí intentamos leer la
// versión más fresca desde GitHub raw (para reflejar refrescos sin redeploy) y
// si falla devolvemos el snapshot empaquetado en el build.
const RAW_URL =
  "https://raw.githubusercontent.com/danfelbm/michidashboard/main/src/data/conteo-nacional.json";

export const revalidate = 120;

export async function GET() {
  try {
    const res = await fetch(RAW_URL, { next: { revalidate: 120 } });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, fuente: "github" });
    }
  } catch {
    /* sin red / repo privado → usar snapshot */
  }
  return NextResponse.json({ ...snapshot, fuente: "snapshot" });
}
