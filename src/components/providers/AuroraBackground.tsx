"use client";

import { useLabStore } from "@/lib/store";

/**
 * Animated aurora background — three blurred radial blobs whose
 * dominant hue shifts with the active section.
 */
const SECTION_OPACITY: Record<string, [number, number, number]> = {
  hero: [0.55, 0.3, 0.16],
  lvm: [0.8, 0.08, 0.05],
  nfs: [0.08, 0.75, 0.12],
  containers: [0.05, 0.18, 0.75],
  pipeline: [0.45, 0.45, 0.45],
  terminal: [0.35, 0.3, 0.35],
  dashboard: [0.12, 0.12, 0.12],
};

export default function AuroraBackground() {
  const activeSection = useLabStore((s) => s.activeSection);
  const op = SECTION_OPACITY[activeSection] ?? SECTION_OPACITY.hero;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#05070f]">
      <div
        className="aurora-blob left-[-10%] top-[-15%] h-[55vmax] w-[55vmax]"
        style={{
          background: "radial-gradient(circle, rgba(124,92,255,0.32) 0%, rgba(124,92,255,0.06) 45%, transparent 70%)",
          opacity: op[0],
          animation: "aurora-a 26s ease-in-out infinite alternate",
        }}
      />
      <div
        className="aurora-blob right-[-15%] top-[20%] h-[50vmax] w-[50vmax]"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.26) 0%, rgba(34,211,238,0.05) 45%, transparent 70%)",
          opacity: op[1],
          animation: "aurora-b 32s ease-in-out infinite alternate",
        }}
      />
      <div
        className="aurora-blob bottom-[-20%] left-[20%] h-[48vmax] w-[48vmax]"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.22) 0%, rgba(52,211,153,0.05) 45%, transparent 70%)",
          opacity: op[2],
          animation: "aurora-c 38s ease-in-out infinite alternate",
        }}
      />
      {/* readability vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, rgba(5,7,15,0.55) 100%)",
        }}
      />
      <style>{`
        @keyframes aurora-a { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(8vw, 6vh, 0) scale(1.15); } }
        @keyframes aurora-b { from { transform: translate3d(0,0,0) scale(1.1); } to { transform: translate3d(-7vw, 9vh, 0) scale(0.95); } }
        @keyframes aurora-c { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(5vw, -7vh, 0) scale(1.18); } }
        @media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none !important; } }
      `}</style>
    </div>
  );
}
