"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, Terminal } from "lucide-react";
import { COMMAND_INDEX } from "@/data/commandIndex";
import { ACCENTS, useLabStore } from "@/lib/store";
import { fuzzyScore } from "@/lib/fuzzy";

/** Cmd/Ctrl+K palette: fuzzy-search every command in the lab and jump to its section. */
export default function CommandPalette() {
  const router = useRouter();
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

  const jump = (route: string) => {
    setOpen(false);
    router.push(route);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-[#141413]/35 px-4 pt-[14vh] backdrop-blur-[2px]"
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="surface w-full max-w-xl overflow-hidden shadow-[0_16px_60px_rgba(20,20,19,0.16)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
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
                    jump(results[idx].route);
                  }
                }}
                placeholder="Search every command in the lab…"
                aria-label="Search commands"
                className="h-14 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-text-faint"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-faint">
                ESC
              </kbd>
            </div>

            <ul role="listbox" className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center font-mono text-xs text-muted-foreground">
                  No command matches “{query}”
                </li>
              )}
              {results.map((entry, i) => {
                const accent = ACCENTS[entry.accent];
                return (
                  <li key={`${entry.cmd}-${i}`}>
                    <button
                      onClick={() => jump(entry.route)}
                      onMouseEnter={() => setIdx(i)}
                      aria-selected={i === idx}
                      role="option"
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100 ${
                        i === idx ? "bg-secondary" : ""
                      }`}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${accent.hex}12` }}
                      >
                        <Terminal className="h-3.5 w-3.5" style={{ color: accent.hex }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[13px] text-foreground">
                          {entry.cmd}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {entry.label} · {entry.sectionTitle}
                        </span>
                      </span>
                      {i === idx && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-faint">
              ↑↓ navigate · ↵ open page
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
