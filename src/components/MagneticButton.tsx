"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  accentHex?: string;
  className?: string;
  cursorLabel?: string;
  ariaLabel?: string;
}

/** Magnetic hover + press-scale (0.97) button. */
export default function MagneticButton({
  children,
  onClick,
  accentHex,
  className = "",
  cursorLabel,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18 });
  const y = useSpring(my, { stiffness: 260, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const relX = (e.clientX - (r.left + r.width / 2)) * 0.28;
    const relY = (e.clientY - (r.top + r.height / 2)) * 0.34;
    mx.set(Math.max(-14, Math.min(14, relX)));
    my.set(Math.max(-10, Math.min(10, relY)));
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      style={{ x, y, ...(accentHex ? { boxShadow: `0 0 0 1px ${accentHex}55, 0 8px 32px ${accentHex}30` } : {}) }}
      data-cursor="button"
      data-cursor-label={cursorLabel}
      aria-label={ariaLabel}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#e8eefc] backdrop-blur transition-colors duration-300 hover:border-white/25 hover:bg-white/10 focus-visible:outline-none ${className}`}
    >
      {accentHex && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(120px circle at 50% 120%, ${accentHex}26, transparent 70%)` }}
        />
      )}
      {children}
    </motion.button>
  );
}
