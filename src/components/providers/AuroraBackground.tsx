"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/store";

/**
 * Animated aurora background — three blurred radial blobs whose
 * dominant hue shifts with the active route.
 */
const ROUTE_TINT: Record<string, [number, number, number]> = {
  [ROUTES.home]: [0.5, 0.28, 0.16],
  [ROUTES.lvm]: [0.8, 0.08, 0.05],
  [ROUTES.nfs]: [0.08, 0.75, 0.12],
  [ROUTES.containers]: [0.05, 0.18, 0.75],
  [ROUTES.pipeline]: [0.45, 0.45, 0.45],
  [ROUTES.terminal]: [0.35, 0.3, 0.35],
  [ROUTES.practice]: [0.4, 0.35, 0.2],
  [ROUTES.resources]: [0.3, 0.3, 0.3],
};

const BASE: [number, number, number] = [0.5, 0.28, 0.16];

export default function AuroraBackground() {
  const pathname = usePathname();
  const op = ROUTE_TINT[pathname] ?? BASE;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#05070f]">
      {/* static grain bed — reinforces the noisy theme for free (no animation) */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)' opacity='0.16'/%3E%3C/svg%3E")`,
          backgroundSize: "160px 160px",
        }}
      />
      <div
        className="aurora-blob left-[-14%] top-[-18%] h-[70vmax] w-[70vmax]"
        style={{
          background: "radial-gradient(circle, rgba(124,92,255,0.30) 0%, rgba(124,92,255,0.14) 34%, rgba(124,92,255,0.04) 58%, transparent 76%)",
          opacity: op[0],
          animation: "aurora-a 26s ease-in-out infinite alternate",
        }}
      />
      <div
        className="aurora-blob right-[-18%] top-[16%] h-[64vmax] w-[64vmax]"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.24) 0%, rgba(34,211,238,0.11) 34%, rgba(34,211,238,0.03) 58%, transparent 76%)",
          opacity: op[1],
          animation: "aurora-b 32s ease-in-out infinite alternate",
        }}
      />
      <div
        className="aurora-blob bottom-[-24%] left-[16%] h-[62vmax] w-[62vmax]"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.20) 0%, rgba(52,211,153,0.09) 34%, rgba(52,211,153,0.03) 58%, transparent 76%)",
          opacity: op[2],
          animation: "aurora-c 38s ease-in-out infinite alternate",
        }}
      />
      {/* readability vignette + faint scanline texture */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, rgba(5,7,15,0.6) 100%), repeating-linear-gradient(0deg, rgba(143,162,201,0.016) 0px, rgba(143,162,201,0.016) 1px, transparent 1px, transparent 4px)",
        }}
      />
      <style>{`
        @keyframes aurora-a { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(7vw, 5vh, 0) scale(1.12); } }
        @keyframes aurora-b { from { transform: translate3d(0,0,0) scale(1.1); } to { transform: translate3d(-6vw, 8vh, 0) scale(0.96); } }
        @keyframes aurora-c { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(4vw, -6vh, 0) scale(1.14); } }
        @media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none !important; } }
      `}</style>
    </div>
  );
}
