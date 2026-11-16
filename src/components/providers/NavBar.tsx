"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Command, Search, TerminalSquare } from "lucide-react";
import { useLabStore, type SectionId } from "@/lib/store";
import { scrollToSection } from "@/lib/scroll";

const LINKS: { id: SectionId; label: string; num: string }[] = [
  { id: "lvm", label: "LVM", num: "01" },
  { id: "nfs", label: "NFS", num: "02" },
  { id: "containers", label: "Containers", num: "03" },
  { id: "practice", label: "Arena", num: "04" },
  { id: "terminal", label: "Terminal", num: "05" },
  { id: "resources", label: "Resources", num: "06" },
];

/** Fixed top navigation: chapter jumps, active highlight, ⌘K search. */
export default function NavBar() {
  const active = useLabStore((s) => s.activeSection);
  const setPaletteOpen = useLabStore((s) => s.setPaletteOpen);
  const introDone = useLabStore((s) => s.introDone);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={reduced ? false : { y: -64, opacity: 0 }}
      animate={{ y: introDone ? 0 : -64, opacity: introDone ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30, delay: 0.15 }}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "glass-strong border-b border-white/8" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 md:px-8">
        <button
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8eefc]"
          aria-label="Back to top"
        >
          <TerminalSquare className="h-4 w-4 text-[#4ade80]" />
          <span className="hidden sm:inline">linux&nbsp;lab</span>
          <span className="sm:hidden">ll</span>
        </button>

        <nav aria-label="Sections" className="mx-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const isActive = active === l.id;
            return (
              <button
                key={l.id}
                onClick={() => scrollToSection(l.id)}
                aria-current={isActive ? "true" : undefined}
                className={`relative rounded-lg px-3 py-1.5 font-mono text-[11.5px] transition-colors ${
                  isActive ? "text-[#e8eefc]" : "text-[#8fa2c9] hover:text-[#e8eefc]"
                }`}
              >
                <span className="mr-1.5 text-[9px] opacity-60">{l.num}</span>
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-lg border border-white/10 bg-white/6"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette (Control or Command K)"
          className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:border-white/25 hover:text-[#e8eefc] lg:ml-0"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">search</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-white/15 px-1.5 py-0.5 text-[10px] sm:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>
    </motion.header>
  );
}
