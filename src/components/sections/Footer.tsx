"use client";

import { Layers3, RotateCcw } from "lucide-react";
import { scrollToSection } from "@/lib/scroll";
import { useLabStore } from "@/lib/store";

const STACK = [
  "Next.js 16 · App Router",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "three.js · R3F · drei",
  "Framer Motion",
  "Lenis",
  "lucide-react",
];

const LINKS: [string, string][] = [
  ["LVM", "lvm"],
  ["NFS", "nfs"],
  ["Containers", "containers"],
  ["Pipeline", "pipeline"],
  ["Terminal", "terminal"],
  ["Dashboard", "dashboard"],
];

export default function Footer() {
  const replayIntro = useLabStore((s) => s.replayIntro);

  return (
    <footer className="mt-auto border-t border-white/8 bg-[#05070f]/80 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3 md:px-8">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#8fa2c9]">
            <Layers3 className="h-3.5 w-3.5 text-[#7c5cff]" />
            comprehensive linux
          </p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[#8fa2c9]">
            Three case studies, one lab: LVM storage pools, NFS shared storage and Docker containers — composed
            into a single verified pipeline.
          </p>
          <p className="mt-4 font-mono text-[11px] text-[#64748b]">
            © 2026 Case Study Lab · built for engineers who read the man pages
          </p>
        </div>

        <div>
          <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">Sections</p>
          <ul className="grid grid-cols-2 gap-2">
            {LINKS.map(([label, id]) => (
              <li key={id}>
                <button
                  onClick={() => scrollToSection(id)}
                  className="text-[13px] text-[#b9c6e4] transition-colors hover:text-white"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={replayIntro}
            data-cursor="replay"
            data-cursor-label="replay"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:border-[#7c5cff66] hover:text-[#e8eefc]"
          >
            <RotateCcw className="h-3 w-3" />
            replay the laptop intro
          </button>
        </div>

        <div>
          <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">Built with</p>
          <div className="flex flex-wrap gap-1.5">
            {STACK.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 font-mono text-[10.5px] text-[#8fa2c9]"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] text-[#64748b]">
            No images shipped — every pixel is CSS, SVG or WebGL.
          </p>
        </div>
      </div>
    </footer>
  );
}
