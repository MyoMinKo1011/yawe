"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Upload, Shield } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/places", label: "Places", icon: Store },
  { href: "/admin/import", label: "Import", icon: Upload },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 xl:w-56 shrink-0 border-r border-border bg-muted/20 hidden sm:block">
      <div className="sticky top-14 flex flex-col px-3 py-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="flex items-center gap-2 px-3 mb-6">
          <Shield size={18} className="text-primary" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
