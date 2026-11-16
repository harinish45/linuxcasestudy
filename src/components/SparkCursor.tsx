"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  /** hue 0-1 picks the fire ramp (white core → yellow → orange → deep red) */
  heat: number;
}

const FIRE_RAMP = ["#fff7d6", "#ffe08a", "#ffb347", "#ff8c2f", "#ff5e2b", "#e8441f"];

const subscribeFinePointer = (cb: () => void) => {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

/**
 * Fire cursor: a live flame sits exactly ON the pointer tip — every ember
 * spawns at the exact cursor position (zero offset), drifts upward like real
 * fire and fades through a white→yellow→orange→red ramp. Clicking throws a
 * spark burst. Fine pointers only; disabled for reduced-motion users.
 */
export default function SparkCursor() {
  const fine = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  );
  const reduced = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!fine || reduced.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const sparks: Spark[] = [];
    let raf = 0;
    // Exact pointer position in CSS pixels (canvas draws in device px).
    let px = -100;
    let py = -100;
    let hasPointer = false;

    /** Spawn n embers precisely at the cursor tip (css px coords). */
    const spawnAtCursor = (n: number, burst = false) => {
      for (let i = 0; i < n; i++) {
        if (sparks.length > 170) sparks.shift();
        const spread = burst ? 2.4 : 0.7;
        const rise = burst ? -(1.0 + Math.random() * 1.8) : -(0.55 + Math.random() * 0.9);
        sparks.push({
          x: px, // exact — no offset
          y: py, // exact — no offset
          vx: (Math.random() - 0.5) * spread,
          vy: rise,
          life: 0,
          maxLife: burst ? 30 + Math.random() * 16 : 20 + Math.random() * 18,
          size: (burst ? 1.8 : 1.3) + Math.random() * 1.5,
          heat: Math.random(),
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      hasPointer = true;
    };
    const onLeave = () => {
      hasPointer = false;
    };
    const onDown = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      hasPointer = true;
      spawnAtCursor(16, true);
    };

    let flicker = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      flicker++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Steady flame right on the cursor tip: 2 embers every frame.
      if (hasPointer) spawnAtCursor(flicker % 6 === 0 ? 3 : 2);

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        // Fire physics: rise up, cool down, sway slightly.
        s.x += s.vx + Math.sin((s.life + s.heat * 20) * 0.35) * 0.28;
        s.y += s.vy;
        s.vy *= 0.975; // buoyancy eases off
        s.vx *= 0.97;
        const t = 1 - s.life / s.maxLife;
        if (t <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        // Colour shifts down the ramp as the ember cools.
        const idx = Math.min(
          FIRE_RAMP.length - 1,
          Math.floor((1 - t) * FIRE_RAMP.length + (1 - s.heat) * 0.8)
        );
        const alpha = Math.min(1, t * 1.6);

        // Soft glowing ember (radial fade instead of a hard dot).
        const r = s.size * dpr * (0.7 + t * 0.5);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, Math.max(r * 2.4, 2));
        g.addColorStop(0, FIRE_RAMP[Math.min(idx, FIRE_RAMP.length - 1)]);
        g.addColorStop(1, "rgba(255,94,43,0)");
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(r * 2.4, 2), 0, Math.PI * 2);
        ctx.fill();

        // Bright core.
        ctx.globalAlpha = alpha;
        ctx.fillStyle = FIRE_RAMP[Math.max(0, idx - 1)];
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(r * 0.7, 0.8), 0, Math.PI * 2);
        ctx.fill();
      }

      // Flickering glow attached to the pointer itself — the "torch tip".
      if (hasPointer) {
        const pulse = 5.2 + Math.sin(flicker * 0.45) * 1.1 + Math.random() * 0.6;
        const gx = px * dpr;
        const gy = py * dpr;
        const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, pulse * dpr);
        gg.addColorStop(0, "rgba(255,240,200,0.95)");
        gg.addColorStop(0.35, "rgba(255,170,70,0.55)");
        gg.addColorStop(1, "rgba(255,94,43,0)");
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(gx, gy, pulse * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[85]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
