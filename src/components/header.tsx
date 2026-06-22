"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Table2 } from "lucide-react";
import { RecargarButton } from "@/components/recargar-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Evidencias", icon: Table2 },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded bg-primary text-primary-foreground">
            M
          </span>
          <span className="hidden sm:inline">Dashboard Evidencias</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <RecargarButton />
        </div>
      </div>
    </header>
  );
}
