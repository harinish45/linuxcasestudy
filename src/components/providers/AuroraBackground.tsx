"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/store";

/**
 * Warm aurora washes — barely-there tinted gradients on the cream canvas.
 * The dominant hue gently follows the active route. Pure radial gradients
 * (no blur filters) keep the compositor cost near zero.
 */
const ROUTE_TINT: Record<string, [number, number, number]> = {
  [ROUTES.home]: [0.5, 0.24, 0.3],
  [ROUTES.lvm]: [0.75, 0.06, 0.1],
  [ROUTES.nfs]: [0.05, 0.6, 0.1],
  [ROUTES.containers]: [0.05, 0.1, 0.7],
  [ROUTES.pipeline]: [0.4, 0.4, 0.4],
  [ROUTES.terminal]: [0.25, 0.25, 0.4],
  [ROUTES.practice]: [0.5, 0.4, 0.1],
  [ROUTES.resources]: [0.3, 0.4, 0.4],
};

const BASE: [number, number, number] = [0.5, 0.24, 0.3];

export default function AuroraBackground() {
  const pathname = usePathname();
  const op = ROUTE_TINT[pathname] ?? BASE;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="aurora-blob left-[-16%] top-[-20%] h-[70vmax] w-[70vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,87,0.07) 0%, rgba(217,119,87,0.03) 36%, transparent 70%)",
          opacity: op[0],
          animation: "aurora-a 30s ease-in-out infinite alternate",
        }}
      />
      <div
        className="aurora-blob right-[-18%] top-[14%] h-[62vmax] w-[62vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(106,155,204,0.06) 0%, rgba(106,155,204,0.025) 36%, transparent 70%)",
          opacity: op[1],
          animation: "aurora-b 36s ease-in-out infinite alternate",
        }}
      />
      <div
        className="aurora-blob bottom-[-24%] left-[14%] h-[60vmax] w-[60vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(120,140,93,0.055) 0%, rgba(120,140,93,0.022) 36%, transparent 70%)",
          opacity: op[2],
          animation: "aurora-c 42s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes aurora-a { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(5vw, 3vh, 0) scale(1.06); } }
        @keyframes aurora-b { from { transform: translate3d(0,0,0) scale(1.05); } to { transform: translate3d(-4vw, 5vh, 0) scale(0.97); } }
        @keyframes aurora-c { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(3vw, -4vh, 0) scale(1.08); } }
        @media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none !important; } }
      `}</style>
    </div>
  );
}
