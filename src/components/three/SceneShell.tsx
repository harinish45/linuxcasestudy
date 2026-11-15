"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile, useLowPower } from "@/lib/hooks";
import type { ReactNode } from "react";

type Frameloop = "always" | "demand";

interface Props {
  /** SVG diagram fallback for mobile / low-power devices. */
  poster: ReactNode;
  /** Render-prop receiving the frameloop hint (mounts only when near viewport). */
  render: (frameloop: Frameloop) => ReactNode;
  /** Accessible description of the scene. */
  label: string;
  className?: string;
}

/**
 * 3D scene gateway:
 *  - lazy-mounts the canvas when it approaches the viewport (no layout shift, fixed aspect),
 *  - caps DPR at 1.5 (set inside scenes' <Canvas dpr={[1, 1.5]}>),
 *  - swaps to a static SVG poster on phones, few-core devices, or without WebGL,
 *  - pauses the render loop when off-screen.
 */
export default function SceneShell({ poster, render, label, className = "" }: Props) {
  const isMobile = useIsMobile();
  const lowPower = useLowPower();
  const elRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const nearIo = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          nearIo.disconnect();
        }
      },
      { rootMargin: "480px" }
    );
    const onScreenIo = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { rootMargin: "80px" }
    );
    nearIo.observe(el);
    onScreenIo.observe(el);
    return () => {
      nearIo.disconnect();
      onScreenIo.disconnect();
    };
  }, []);

  const setRef = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
  }, []);

  if (isMobile || lowPower) {
    return (
      <div
        role="img"
        aria-label={`${label} (simplified diagram for this device)`}
        className={`relative flex h-full w-full items-center justify-center ${className}`}
      >
        {poster}
      </div>
    );
  }

  const frameloop: Frameloop = onScreen ? "always" : "demand";

  return (
    <div ref={setRef} role="img" aria-label={label} className={`relative h-full w-full ${className}`}>
      {!mounted ? (
        <div className="shimmer absolute inset-0 rounded-2xl" aria-hidden />
      ) : (
        <div className="absolute inset-0">{render(frameloop)}</div>
      )}
    </div>
  );
}
