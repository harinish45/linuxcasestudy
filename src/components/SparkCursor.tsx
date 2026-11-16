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
  color: string;
}

const COLORS = ["#4ade80", "#a3e635", "#e8eefc", "#7c5cff", "#22d3ee"];
const subscribeFinePointer = (cb: () => void) => {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

/**
 * Spark cursor: the native cursor stays untouched; a lightweight canvas trail
 * emits tiny green/white sparks as the mouse moves and bursts on click.
 * Desktop fine-pointer only; disabled for reduced-motion users.
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
    let lastX = -1;
    let lastY = -1;

    const spawn = (x: number, y: number, n: number, burst = false) => {
      for (let i = 0; i < n; i++) {
        if (sparks.length > 140) sparks.shift();
        const a = Math.random() * Math.PI * 2;
        const speed = burst ? 1.2 + Math.random() * 2.6 : 0.25 + Math.random() * 0.85;
        sparks.push({
          x: x * dpr,
          y: y * dpr,
          vx: Math.cos(a) * speed * dpr,
          vy: Math.sin(a) * speed * dpr - (burst ? 0.4 : 0.1) * dpr,
          life: 0,
          maxLife: burst ? 34 + Math.random() * 18 : 22 + Math.random() * 16,
          size: (burst ? 1.6 : 1.1) + Math.random() * 1.4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      if (lastX < 0) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);
      // Faster movement → more sparks (capped).
      const n = Math.min(4, 1 + Math.floor(dist / 14));
      if (dist > 1.2) spawn(e.clientX + (Math.random() - 0.5) * 6, e.clientY + (Math.random() - 0.5) * 6, n);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onDown = (e: MouseEvent) => spawn(e.clientX, e.clientY, 14, true);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy = s.vy * 0.94 + 0.02 * dpr;
        const t = 1 - s.life / s.maxLife;
        if (t <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = t;
        ctx.fillStyle = s.color;
        // Tiny streak oriented along velocity — reads as a spark, not a dot.
        const vx = s.vx * 1.6;
        const vy = s.vy * 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x - vx, s.y - vy);
        ctx.lineTo(s.x + vx, s.y + vy);
        ctx.lineWidth = s.size * dpr * t;
        ctx.lineCap = "round";
        ctx.strokeStyle = s.color;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
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
