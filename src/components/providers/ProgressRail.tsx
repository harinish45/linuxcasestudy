"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SECTION_IDS, useLabStore } from "@/lib/store";
import { scrollToSection } from "@/lib/scroll";

const LABELS: Record<string, string> = {
  hero: "Intro",
  lvm: "01 · LVM",
  nfs: "02 · NFS",
  containers: "03 · Containers",
  practice: "04 · Arena",
  terminal: "05 · Terminal",
  resources: "06 · Resources",
};

/** Left-hand progress rail with glowing dots; reports the active section. */
export default function ProgressRail() {
  const activeSection = useLabStore((s) => s.activeSection);
  const setActiveSection = useLabStore((s) => s.setActiveSection);
  const observed = useRef(false);

  useEffect(() => {
    // Track which section owns the middle of the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observed.current = true;
            setActiveSection(entry.target.id as never);
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [setActiveSection]);

  return (
    <nav
      aria-label="Section progress"
      className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
    >
      {SECTION_IDS.map((id) => {
        const active = id === activeSection;
        return (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            aria-label={`Jump to ${LABELS[id]}`}
            aria-current={active ? "true" : undefined}
            className="group relative flex h-5 w-5 items-center justify-center"
          >
            <motion.span
              className="block rounded-full"
              animate={{
                width: active ? 10 : 6,
                height: active ? 10 : 6,
                backgroundColor: active ? "#e8eefc" : "rgba(143,162,201,0.4)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              style={
                active
                  ? { boxShadow: "0 0 12px rgba(124,92,255,0.9), 0 0 28px rgba(124,92,255,0.45)" }
                  : undefined
              }
            />
            <span className="pointer-events-none absolute left-7 whitespace-nowrap rounded-md border border-white/10 bg-[#0a0e1c]/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#8fa2c9] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {LABELS[id]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
