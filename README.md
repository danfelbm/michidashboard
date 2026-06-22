# Dashboard de Evidencias — Pacto Histórico

Portal en **Next.js** para explorar las **evidencias de formularios E‑14** que llegan a la API de michi durante el conteo electoral, con **filtros geográficos completos** (departamento → municipio → zona → puesto → mesa) y un **panel de estadísticas/conteo** de votos.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (Base UI)
- **TanStack Query** para data fetching / cache
- Diseño **mobile-first**

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea `.env.local` a partir de `.env.example` y coloca el token de la API
   (el token vive **solo en el servidor**; nunca se expone al navegador):

   ```bash
   cp .env.example .env.local
   # edita .env.local y completa MICHI_API_TOKEN
   ```

   ```
   MICHI_API_TOKEN=xxx|xxxxxxxx
   MICHI_API_BASE=https://michi.movimientopactohistorico.co/api/v1
   ```

3. (Opcional) Regenera el catálogo geográfico recorriendo la API. Ya viene uno
   commiteado en `src/data/geo-catalogo.json`, pero puedes refrescarlo:

   ```bash
   npm run harvest:geo
   ```

4. Desarrollo:

   ```bash
   npm run dev
   ```

   Producción:

   ```bash
   npm run build && npm run start
   ```

## Arquitectura

### Seguridad del token (proxy server-side)

El navegador **solo** llama a rutas de mismo origen bajo `/api/evidencias/*`.
Cada Route Handler ([src/app/api/evidencias/](src/app/api/evidencias/)) inyecta
el header `Authorization: Bearer <token>` y reenvía la petición a la API de michi.
El token nunca llega al cliente.

| Ruta | Función |
|------|---------|
| `GET /api/evidencias` | Lista paginada con filtros |
| `GET /api/evidencias/[id]` | Detalle de una evidencia |
| `GET /api/evidencias/[id]/pdf` | Redirige al PDF firmado (`pdf_url`) |
| `GET /api/evidencias/stats` | Agrega votos recorriendo páginas |

### Filtros disponibles (API)

- **Geográfico** (`divipol`, slug parcial): 2 díg = departamento, 5 = municipio,
  7 = zona, 10 = puesto, 14 = mesa. La cascada de selects construye el slug
  ([src/lib/divipol.ts](src/lib/divipol.ts)).
- `estado` (pendiente / aprobada / rechazada), `origen` (testigo / público)
- `desde` / `hasta` (rango de fechas)
- `proceso_electoral_id`, `formato_id`, `cargo_id` (derivados dinámicamente)

> La API limita `per_page` a **100** y no expone catálogo geográfico, por eso
> los departamentos/municipios se obtienen con `npm run harvest:geo`.

### Estadísticas y conteo nacional

El panel ([/estadisticas](src/app/estadisticas/page.tsx)) tiene dos partes:

**1. Conteo Nacional (deduplicado por mesa).** La API no expone agregación, así
que sumar evidencias crudas sobrecuenta (~1,9 evidencias por mesa: los testigos
reenvían la misma mesa varias veces). El conteo correcto **deduplica por mesa**:
una evidencia por mesa, prefiriendo `aprobada` sobre `pendiente`, y a igual
jerarquía la más reciente; se descartan las `rechazada`.

Como recorrer las ~120 páginas (`per_page=1000`) tarda **~3 min**, no cabe en un
request de Vercel. Por eso el cálculo vive en un script:

```bash
npm run aggregate   # recorre todo, dedup por mesa → src/data/conteo-nacional.json
```

El dashboard lee ese JSON (vía GitHub raw, para refrescar sin redeploy). Para
mantenerlo fresco automáticamente hay un **GitHub Action**
([.github/workflows/aggregate.yml](.github/workflows/aggregate.yml)) que lo
ejecuta cada ~15 min. Para activarlo, añade el secret **`MICHI_API_TOKEN`** en
*Settings → Secrets and variables → Actions* del repo.

**2. Conteo por ámbito filtrado.** Suma de votos (también dedup por mesa) sobre
el universo que filtres (departamento/municipio/zona…). Recorre hasta 15 páginas
y marca el resultado como *parcial* si hay más; **filtra por municipio** para
conteos acotados y completos.

### Estado en la URL

Todos los filtros viven en los query params de la URL, así cada vista es
compartible y sobrevive a recargas ([src/hooks/use-filtros-url.ts](src/hooks/use-filtros-url.ts)).
El botón **Recargar** del header invalida las queries para traer datos frescos
(los datos crecen en vivo durante el conteo).
