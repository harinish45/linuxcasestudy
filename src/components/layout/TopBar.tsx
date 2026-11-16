"use client";

import { usePathname } from "next/navigation";
import { Menu, Search, Terminal } from "lucide-react";
import { ROUTES, useLabStore } from "@/lib/store";

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.home]: "Dashboard",
  [ROUTES.lvm]: "01 · LVM — Storage that grows",
  [ROUTES.nfs]: "02 · NFS — One share, every machine",
  [ROUTES.containers]: "03 · Containers — Ship it once",
  [ROUTES.practice]: "Challenge Arena",
  [ROUTES.terminal]: "Terminal Lab",
  [ROUTES.pipeline]: "Integration Pipeline",
  [ROUTES.resources]: "Resources",
};

/** Slim top bar: hamburger (mobile), page title, search. */
export default function TopBar() {
  const pathname = usePathname();
  const setOpen = useLabStore((s) => s.setSidebarOpen);
  const setPaletteOpen = useLabStore((s) => s.setPaletteOpen);
  const title = PAGE_TITLES[pathname] ?? "Linux Lab";

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/8 bg-[#05070f]/80 px-4 backdrop-blur-xl md:px-8"
      aria-label="Page header"
    >
      {/* hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-lg border border-white/10 bg-white/4 p-2 text-[#8fa2c9] transition-colors hover:text-white lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <span className="flex items-center gap-2 font-mono text-[12px] tracking-wide text-[#b9c6e4] lg:hidden">
        <Terminal className="h-3.5 w-3.5 text-[#4ade80]" />
        linux lab
      </span>

      {/* desktop page title */}
      <p className="hidden truncate font-mono text-[12px] uppercase tracking-[0.18em] text-[#8fa2c9] lg:block">
        {title}
      </p>

      <button
        onClick={() => setPaletteOpen(true)}
        aria-label="Search commands (Control or Command K)"
        className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:border-white/25 hover:text-[#e8eefc]"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">search</span>
        <kbd className="hidden items-center rounded border border-white/15 px-1.5 py-0.5 text-[10px] sm:flex">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}

