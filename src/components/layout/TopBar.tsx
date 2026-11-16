"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { ROUTES, useLabStore } from "@/lib/store";
import ThemeToggle from "@/components/ThemeToggle";

const CRUMBS: Record<string, { root: string; page: string }> = {
  [ROUTES.home]: { root: "Lab", page: "Dashboard" },
  [ROUTES.lvm]: { root: "Courses", page: "01 · LVM" },
  [ROUTES.nfs]: { root: "Courses", page: "02 · NFS" },
  [ROUTES.containers]: { root: "Courses", page: "03 · Containers" },
  [ROUTES.practice]: { root: "Practice", page: "Challenge Arena" },
  [ROUTES.terminal]: { root: "Practice", page: "Terminal Lab" },
  [ROUTES.pipeline]: { root: "Explore", page: "Integration Pipeline" },
  [ROUTES.resources]: { root: "Explore", page: "Resources" },
};

/** Minimal top bar: hamburger (mobile), breadcrumb, search, theme toggle. */
export default function TopBar() {
  const pathname = usePathname();
  const setOpen = useLabStore((s) => s.setSidebarOpen);
  const setPaletteOpen = useLabStore((s) => s.setPaletteOpen);
  const crumb = CRUMBS[pathname] ?? { root: "Lab", page: "Linux Lab" };

  return (
    <header
      className="sticky top-0 z-30 flex h-[52px] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-8"
      aria-label="Page header"
    >
      {/* hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-faint sm:inline">
          {crumb.root}
        </span>
        <span aria-hidden className="hidden text-text-faint sm:inline">
          /
        </span>
        <span className="truncate text-muted-foreground">{crumb.page}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Search commands (Control or Command K)"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-input hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden items-center rounded border border-border px-1.5 py-0.5 font-mono text-[9.5px] text-text-faint sm:flex">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
