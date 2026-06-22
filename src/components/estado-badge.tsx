import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  aprobada: {
    label: "Aprobada",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rechazada: {
    label: "Rechazada",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const cfg = MAP[estado] ?? {
    label: estado,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
