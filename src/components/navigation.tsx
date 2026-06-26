"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Headphones,
  Library,
  Bot,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/capture", label: "Captura", icon: PlusCircle },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/practice", label: "Prática", icon: Headphones },
  { href: "/coach", label: "AI Coach", icon: Bot },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-onyx text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-candy-blue-500" : "text-slate-400",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 md:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Foco de hoje
        </p>
        <p className="mt-2 text-sm leading-5 text-slate-600">
          Ouvir → Repetir → Usar
        </p>
      </div>
    </nav>
  );
}
