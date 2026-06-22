"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { departamentos, municipiosDe } from "@/lib/geo";
import { buildDivipol, parseDivipol, type NivelesGeo } from "@/lib/divipol";

const TODOS = "__todos__";

export function FiltrosGeograficos({
  divipol,
  onChange,
}: {
  divipol: string | undefined;
  onChange: (divipol: string) => void;
}) {
  const niveles = useMemo(() => parseDivipol(divipol), [divipol]);

  const munis = useMemo(
    () => municipiosDe(niveles.departamento),
    [niveles.departamento],
  );

  const aplicar = (cambios: Partial<NivelesGeo>) => {
    const next: NivelesGeo = { ...niveles, ...cambios };
    // Si se limpia un nivel superior, limpiar los inferiores.
    if (cambios.departamento !== undefined) {
      next.municipio = undefined;
      next.zona = undefined;
      next.puesto = undefined;
      next.mesa = undefined;
    }
    if (cambios.municipio !== undefined) {
      next.zona = undefined;
      next.puesto = undefined;
      next.mesa = undefined;
    }
    onChange(buildDivipol(next));
  };

  const sinCatalogo = departamentos.length === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="f-depto">Departamento</Label>
        <Select
          value={niveles.departamento ?? TODOS}
          onValueChange={(v) =>
            aplicar({ departamento: !v || v === TODOS ? undefined : `${v}` })
          }
        >
          <SelectTrigger id="f-depto" className="w-full">
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los departamentos</SelectItem>
            {departamentos.map((d) => (
              <SelectItem key={d.codigo} value={d.codigo}>
                {d.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sinCatalogo && (
          <p className="text-xs text-muted-foreground">
            Catálogo geográfico vacío. Ejecuta{" "}
            <code className="font-mono">npm run harvest:geo</code>.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-muni">Municipio</Label>
        <Select
          value={niveles.municipio ?? TODOS}
          onValueChange={(v) =>
            aplicar({ municipio: !v || v === TODOS ? undefined : `${v}` })
          }
          disabled={!niveles.departamento}
        >
          <SelectTrigger id="f-muni" className="w-full">
            <SelectValue placeholder="Todos los municipios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los municipios</SelectItem>
            {munis.map((m) => (
              <SelectItem key={m.codigo} value={m.codigo}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label htmlFor="f-zona">Zona</Label>
          <Input
            id="f-zona"
            inputMode="numeric"
            placeholder="00"
            value={niveles.zona ?? ""}
            disabled={!niveles.municipio}
            onChange={(e) => aplicar({ zona: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-puesto">Puesto</Label>
          <Input
            id="f-puesto"
            inputMode="numeric"
            placeholder="00"
            value={niveles.puesto ?? ""}
            disabled={!niveles.zona}
            onChange={(e) => aplicar({ puesto: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-mesa">Mesa</Label>
          <Input
            id="f-mesa"
            inputMode="numeric"
            placeholder="000"
            value={niveles.mesa ?? ""}
            disabled={!niveles.puesto}
            onChange={(e) => aplicar({ mesa: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-divipol">DIVIPOL (slug directo)</Label>
        <Input
          id="f-divipol"
          placeholder="Ej: 16001"
          value={divipol ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          2=depto · 5=municipio · 7=zona · 10=puesto · 14=mesa
        </p>
      </div>
    </div>
  );
}
