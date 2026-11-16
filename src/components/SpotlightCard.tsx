"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Enable 3D tilt (max 6°) — disabled for reduced-motion users. */
  tilt?: boolean;
}

/**
 * Glass card with a cursor-following spotlight (radial gradient tracked via
 * CSS vars) and optional mouse tilt capped at ±6°.
 */
export default function SpotlightCard({ children, className = "", tilt = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (tilt && !reduced) {
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}
