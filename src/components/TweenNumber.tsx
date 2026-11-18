"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface Props {
  target: number;
  decimals?: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

/** Smoothly tweens a number toward `target` whenever it changes (DOM-driven, no re-render). */
export default function TweenNumber({ target, decimals = 1, duration = 1100, className, suffix = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [initial] = useState(() => target.toFixed(decimals));
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useLayoutEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      if (ref.current) ref.current.textContent = v.toFixed(decimals) + suffix;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, decimals, duration, suffix]);

  return (
    <span ref={ref} className={className}>
      {initial}
      {suffix}
    </span>
  );
}
