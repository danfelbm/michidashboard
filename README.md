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

### Estadísticas

El panel ([/estadisticas](src/app/estadisticas/page.tsx)) suma votos por
candidato sobre el universo filtrado. Para evitar timeouts, recorre hasta
**60 páginas** (6.000 evidencias) por consulta y marca el resultado como
*parcial* cuando hay más. **Filtra por municipio** para conteos completos.

### Estado en la URL

Todos los filtros viven en los query params de la URL, así cada vista es
compartible y sobrevive a recargas ([src/hooks/use-filtros-url.ts](src/hooks/use-filtros-url.ts)).
El botón **Recargar** del header invalida las queries para traer datos frescos
(los datos crecen en vivo durante el conteo).
