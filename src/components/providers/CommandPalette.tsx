"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search, Terminal } from "lucide-react";
import { COMMAND_INDEX } from "@/data/commandIndex";
import { ACCENTS, useLabStore } from "@/lib/store";
import { scrollToSection } from "@/lib/scroll";
import { fuzzyScore } from "@/lib/fuzzy";

/** Cmd/Ctrl+K palette: fuzzy-search every command in the lab and jump to its section. */
export default function CommandPalette() {
  const open = useLabStore((s) => s.paletteOpen);
  const setOpen = useLabStore((s) => s.setPaletteOpen);
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const scored = COMMAND_INDEX.map((e) => ({
      entry: e,
      score: fuzzyScore(query, `${e.cmd} ${e.label} ${e.sectionTitle}`),
    }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    return scored.map((r) => r.entry);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!open) {
          setQuery("");
          setIdx(0);
        }
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const jump = (section: string) => {
    setOpen(false);
    setTimeout(() => scrollToSection(section), 60);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-[#05070f]/70 px-4 pt-[14vh] backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="glass-strong w-full max-w-xl overflow-hidden rounded-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-4 w-4 text-[#8fa2c9]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIdx((i) => Math.min(results.length - 1, i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIdx((i) => Math.max(0, i - 1));
                  } else if (e.key === "Enter" && results[idx]) {
                    jump(results[idx].section);
                  }
                }}
                placeholder="Search every command in the lab…"
                aria-label="Search commands"
                className="h-14 flex-1 bg-transparent font-mono text-sm text-[#e8eefc] outline-none placeholder:text-[#8fa2c9]/60"
              />
              <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#8fa2c9]">
                ESC
              </kbd>
            </div>

            <ul role="listbox" className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center font-mono text-xs text-[#8fa2c9]">
                  No command matches “{query}”
                </li>
              )}
              {results.map((entry, i) => {
                const accent = ACCENTS[entry.accent];
                return (
                  <li key={`${entry.cmd}-${i}`}>
                    <button
                      onClick={() => jump(entry.section)}
                      onMouseEnter={() => setIdx(i)}
                      aria-selected={i === idx}
                      role="option"
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        i === idx ? "bg-white/8" : ""
                      }`}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${accent.hex}1f`, border: `1px solid ${accent.hex}44` }}
                      >
                        <Terminal className="h-3.5 w-3.5" style={{ color: accent.hex }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[13px] text-[#e8eefc]">
                          {entry.cmd}
                        </span>
                        <span className="block text-[11px] text-[#8fa2c9]">
                          {entry.label} · {entry.sectionTitle}
                        </span>
                      </span>
                      {i === idx && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[#8fa2c9]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-white/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#8fa2c9]">
              ↑↓ navigate · ↵ jump to section
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
