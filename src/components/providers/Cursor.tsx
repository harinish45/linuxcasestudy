"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const subscribeFinePointer = (cb: () => void) => {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

/**
 * Custom cursor: a small ring that grows on interactive elements
 * and shows a contextual label from data-cursor-label attributes.
 * Desktop (fine pointer) only; native cursor stays for touch devices.
 */
export default function Cursor() {
  const fine = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  );
  const [label, setLabel] = useState<string | null>(null);
  const [hot, setHot] = useState(false);
  const [down, setDown] = useState(false);

  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const x = useSpring(mx, { stiffness: 520, damping: 38, mass: 0.6 });
  const y = useSpring(my, { stiffness: 520, damping: 38, mass: 0.6 });

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add("cursor-live");

    const move = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-cursor]") as HTMLElement | null;
      if (el) {
        setHot(true);
        setLabel(el.dataset.cursorLabel || null);
      } else {
        const interactive = (e.target as HTMLElement).closest?.(
          "a, button, input, select, textarea, [role='button'], summary"
        );
        setHot(!!interactive);
        setLabel(null);
      }
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("cursor-live");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup", up);
    };
  }, [mx, my, fine]);

  if (!fine) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100]"
      style={{ x, y }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full border border-white/50"
        animate={{
          width: hot ? 52 : 22,
          height: hot ? 52 : 22,
          opacity: down ? 0.6 : 1,
          scale: down ? 0.88 : 1,
          backgroundColor: hot ? "rgba(124,92,255,0.12)" : "rgba(124,92,255,0)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        style={{ marginLeft: -26, marginTop: -26 }}
      >
        <motion.span
          className="w-1 h-1 rounded-full bg-white/80 absolute"
          animate={{ opacity: hot ? 0 : 1 }}
        />
      </motion.div>
      {label && (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-8 top-3 whitespace-nowrap rounded-md border border-white/10 bg-[#0a0e1c]/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#e8eefc]"
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}
