"use client";

import { cn } from "@/lib/utils";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, isAdmin, signOut } = useSupabase();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <img src="/logo.png" alt="ywae" className="h-12 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted",
              pathname === "/" && "bg-muted font-medium",
            )}
          >
            Chat
          </Link>
          <Link
            href="/explore"
            className={cn(
              "px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted",
              pathname === "/explore" && "bg-muted font-medium",
            )}
          >
            စူးစမ်းရန်
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Shield size={14} className="mr-1" />
                Admin
              </Button>
            </Link>
          )}
          {user ? (
            <DropdownMenu
              trigger={
                <Avatar
                  src={user.user_metadata?.avatar_url}
                  fallback={
                    user.user_metadata?.full_name ?? user.email ?? "ဧည့်သည်"
                  }
                  size="sm"
                />
              }
            >
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                {user.email}
              </div>
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                ထွက်မည်
              </DropdownMenuItem>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                ဝင်ရောက်ရန်
              </Button>
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="မီနူး"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-2">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(false)}
          >
            Chat
          </Link>
          <Link
            href="/explore"
            className="block px-3 py-2 rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(false)}
          >
            စူးစမ်းရန်
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-3 py-2 rounded-md hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                signOut();
                setMobileOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-destructive hover:bg-muted"
            >
              ထွက်မည်
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="block px-3 py-2 rounded-md hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              ဝင်ရောက်ရန်
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
