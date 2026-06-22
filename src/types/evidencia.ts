// Tipos derivados de la respuesta real de GET /api/v1/evidencias-formato

export interface RefBasica {
  id: number;
  titulo?: string;
  nombre?: string;
  codigo?: string;
}

export interface GeoNivel {
  id?: number;
  codigo: string;
  nombre: string;
}

export interface Geografia {
  divipol: string | null;
  departamento: GeoNivel | null;
  municipio: GeoNivel | null;
  zona: { codigo: string; nombre: string } | null;
  puesto: { codigo: string; nombre: string } | null;
  mesa: { id?: number; numero: string } | null;
}

export interface Remitente {
  nombre: string | null;
  tipo: string | null;
}

export interface RespuestaFormulario {
  campo_id: string;
  campo_alias: string;
  campo_titulo: string;
  campo_tipo: string;
  valor: number | string | null;
  constantes: {
    codigo_partido?: string;
    codigo_candidato?: string;
  } | null;
}

export type EstadoEvidencia = "pendiente" | "aprobada" | "rechazada";
export type OrigenEvidencia = "testigo" | "publico";

export interface Evidencia {
  id: number;
  estado: EstadoEvidencia | string;
  estado_procesamiento: string | null;
  origen: OrigenEvidencia | string;
  created_at: string;
  updated_at: string;
  revisado_at: string | null;
  proceso_electoral: { id: number; titulo: string } | null;
  formato: { id: number; codigo: string; nombre: string } | null;
  cargo: { id: number; nombre: string } | null;
  geografia: Geografia;
  remitente: Remitente;
  respuestas_formulario: RespuestaFormulario[];
  pdf_url: string | null;
  pdf_url_expires_at: string | null;
  pdf_filename: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  to?: number | null;
  last_page: number;
  per_page: number;
  total: number;
}

export interface EvidenciasResponse {
  data: Evidencia[];
  meta: PaginationMeta;
  links?: Record<string, string | null>;
}

// Filtros que acepta la API (query params)
export interface FiltrosEvidencias {
  divipol?: string;
  proceso_electoral_id?: string;
  formato_id?: string;
  cargo_id?: string;
  estado?: string;
  origen?: string;
  desde?: string;
  hasta?: string;
  page?: string;
  per_page?: string;
}
