"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FiltrosGeograficos } from "./filtros-geograficos";
import type { FiltrosEvidencias } from "@/types/evidencia";

const TODOS = "__todos__";

export interface OpcionFaceta {
  id: string;
  label: string;
}

export function FiltrosEvidenciasPanel({
  filtros,
  onChange,
  facetas,
}: {
  filtros: FiltrosEvidencias;
  onChange: (cambios: Partial<FiltrosEvidencias>) => void;
  facetas?: {
    proceso?: OpcionFaceta[];
    formato?: OpcionFaceta[];
    cargo?: OpcionFaceta[];
  };
}) {
  const selectFaceta = (
    label: string,
    clave: keyof FiltrosEvidencias,
    opciones: OpcionFaceta[] | undefined,
  ) => {
    if (!opciones || opciones.length === 0) return null;
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select
          value={filtros[clave] ?? TODOS}
          onValueChange={(v) =>
            onChange({ [clave]: !v || v === TODOS ? "" : `${v}` })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Todos`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            {opciones.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <FiltrosGeograficos
        divipol={filtros.divipol}
        onChange={(divipol) => onChange({ divipol })}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="f-estado">Estado</Label>
        <Select
          value={filtros.estado ?? TODOS}
          onValueChange={(v) =>
            onChange({ estado: !v || v === TODOS ? "" : `${v}` })
          }
        >
          <SelectTrigger id="f-estado" className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-origen">Origen</Label>
        <Select
          value={filtros.origen ?? TODOS}
          onValueChange={(v) =>
            onChange({ origen: !v || v === TODOS ? "" : `${v}` })
          }
        >
          <SelectTrigger id="f-origen" className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="testigo">Testigo</SelectItem>
            <SelectItem value="publico">Público</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectFaceta("Proceso electoral", "proceso_electoral_id", facetas?.proceso)}
      {selectFaceta("Formato", "formato_id", facetas?.formato)}
      {selectFaceta("Cargo", "cargo_id", facetas?.cargo)}

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="f-desde">Desde</Label>
          <Input
            id="f-desde"
            type="date"
            value={filtros.desde ?? ""}
            onChange={(e) => onChange({ desde: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-hasta">Hasta</Label>
          <Input
            id="f-hasta"
            type="date"
            value={filtros.hasta ?? ""}
            onChange={(e) => onChange({ hasta: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
