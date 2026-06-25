"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Painel" },
  { href: "/capture", label: "Captura" },
  { href: "/library", label: "Biblioteca" },
  { href: "/review", label: "Revisão" },
];

export function Navigation() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <nav className="flex gap-1 overflow-x-auto px-4 py-3 md:flex-col md:overflow-visible md:px-0">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
              isDashboard
                ? "text-candy-blue-500/65 hover:bg-candy-blue-500/10 hover:text-candy-blue-500"
                : "text-slate-600 hover:bg-slate-100 hover:text-onyx",
              isActive &&
                (isDashboard
                  ? "bg-candy-blue-500 text-onyx hover:bg-candy-blue-500 hover:text-onyx"
                  : "bg-onyx text-white hover:bg-onyx hover:text-white"),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
