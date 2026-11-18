"use client";

import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  accentHex?: string;
  className?: string;
  cursorLabel?: string;
  ariaLabel?: string;
}

/** Standard refined button: subtle press feedback, optional accent ring. */
export default function MagneticButton({
  children,
  onClick,
  accentHex,
  className = "",
  cursorLabel,
  ariaLabel,
}: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={
        accentHex
          ? { boxShadow: `0 0 0 1px ${accentHex}44`, color: accentHex }
          : undefined
      }
      data-cursor="button"
      data-cursor-label={cursorLabel}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-secondary focus-visible:outline-none ${className}`}
    >
      {children}
    </motion.button>
  );
}
