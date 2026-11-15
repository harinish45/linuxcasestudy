"use client";

import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

interface Props {
  /** Mono title in the panel header, e.g. "interactive demo · lvextend". */
  title: string;
  accentHex: string;
  /** Right-aligned status chips in the header. */
  badges?: ReactNode;
  /** Stage content (3D canvas or SVG poster). Fixed height, no layout shift. */
  children: ReactNode;
  /** Footer control bar (buttons / toggles / readouts). */
  controls?: ReactNode;
  /** Extra content below the controls (e.g. terminal readout). */
  footnote?: ReactNode;
  heightClass?: string;
  className?: string;
}

/**
 * The one demo stage used by all three case studies — identical header,
 * fixed-height stage and control bar so every section shares the same
 * visual rhythm and alignment.
 */
export default function DemoPanel({
  title,
  accentHex,
  badges,
  children,
  controls,
  footnote,
  heightClass = "h-[420px] md:h-[520px]",
  className = "",
}: Props) {
  return (
    <Reveal className={className}>
      <div className="glass overflow-hidden rounded-3xl">
        {/* header */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/8 px-4 py-3 md:px-5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accentHex, boxShadow: `0 0 10px ${accentHex}` }} />
          <p className="font-mono text-[11.5px] uppercase tracking-[0.22em] text-[#e8eefc]">{title}</p>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{badges}</div>
        </div>

        {/* stage */}
        <div className={`dotgrid relative overflow-hidden bg-[#070a16]/60 ${heightClass}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 42%, transparent 40%, rgba(5,7,15,0.55) 100%)",
            }}
          />
          <div className="absolute inset-0">{children}</div>
        </div>

        {/* controls */}
        {controls && (
          <div className="border-t border-white/8 bg-white/[0.02] px-4 py-3.5 md:px-5">{controls}</div>
        )}
        {footnote && <div className="border-t border-white/8 px-4 py-3 md:px-5">{footnote}</div>}
      </div>
    </Reveal>
  );
}
