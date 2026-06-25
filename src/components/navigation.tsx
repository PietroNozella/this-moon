"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/capture", label: "Capture" },
  { href: "/library", label: "Library" },
  { href: "/review", label: "Review" },
  { href: "/practice", label: "Practice" },
  { href: "/music", label: "Music" },
  { href: "/games", label: "Games" },
  { href: "/programming", label: "Programming" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Navigation() {
  const pathname = usePathname();

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
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
              isActive && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
