"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  /** sprite radius in css px — small by design (2.2–4.2) */
  r: number;
  /** picks which pre-rendered sprite (hue) to draw */
  tone: number;
}

const CANVAS_PX = 280; // small square that follows the cursor
const MAX_SPARKS = 48;
const IDLE_STOP_MS = 260; // stop the loop entirely when nothing moves

const subscribeFinePointer = (cb: () => void) => {
  const mql = window.matchMedia("(pointer: fine)");
  const mqlNone = window.matchMedia("(pointer: none)");
  const cbBoth = () => cb();
  mql.addEventListener("change", cbBoth);
  mqlNone.addEventListener("change", cbBoth);
  return () => {
    mql.removeEventListener("change", cbBoth);
    mqlNone.removeEventListener("change", cbBoth);
  };
};

/** Sparks are for fine pointers; headless environments (pointer: none)
    also pass so previews can screenshot them — emission still requires
    real pointermove events, so touch devices stay spark-free. */
const wantsSparks = () =>
  window.matchMedia("(pointer: fine)").matches ||
  window.matchMedia("(pointer: none)").matches;

/**
 * Spark cursor — SMALL sparks, exactly on the pointer tip.
 * Perf model:
 *  - A 280×280 canvas rides the cursor via transform (tiny repaint area,
 *    no full-screen compositing, no mix-blend over the whole page).
 *  - Sparks are pre-rendered sprites blitted with drawImage — zero
 *    per-frame gradient allocations.
 *  - Sparks only emit while the pointer actually moves (+ a tiny burst on
 *    click); when the pointer rests and the trail dies out the RAF loop is
 *    cancelled completely, so idle CPU cost is exactly zero.
 */
export default function SparkCursor() {
  const fine = useSyncExternalStore(
    subscribeFinePointer,
    wantsSparks,
    () => false
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fine) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(CANVAS_PX * dpr);
    canvas.height = Math.floor(CANVAS_PX * dpr);

    /* ── pre-rendered spark sprites (tiny soft glows) ─────────────── */
    const S = Math.floor(24 * dpr);
    const makeSprite = (core: string, halo: string) => {
      const c = document.createElement("canvas");
      c.width = S;
      c.height = S;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, core);
      grad.addColorStop(0.32, halo);
      grad.addColorStop(1, "rgba(255,140,60,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, S, S);
      return c;
    };
    const TONES = [
      makeSprite("rgba(255,247,235,0.95)", "rgba(235,166,120,0.5)"), // warm cream
      makeSprite("rgba(240,186,142,0.9)", "rgba(217,119,87,0.42)"), // terracotta
      makeSprite("rgba(224,140,109,0.82)", "rgba(198,97,63,0.38)"), // deep terracotta ember
    ];

    const sparks: Spark[] = [];
    let raf = 0;
    let running = false;
    let frame = 0;
    let lastSeen = 0;
    // pointer position in CSS px
    let px = -9999;
    let py = -9999;
    let prevX = -9999;
    let prevY = -9999;

    /** Spawn n tiny sparks precisely at the cursor tip (canvas coords). */
    const spawnAtCursor = (n: number, burst = false) => {
      const cx = (CANVAS_PX / 2) * dpr;
      const cy = (CANVAS_PX / 2) * dpr;
      for (let i = 0; i < n; i++) {
        if (sparks.length >= MAX_SPARKS) sparks.shift();
        const ang = burst
          ? Math.random() * Math.PI * 2
          : Math.PI / 2 + (Math.random() - 0.5) * 1.5; // upward fan
        const sp = burst ? 0.9 + Math.random() * 1.4 : 0.25 + Math.random() * 0.7;
        sparks.push({
          x: cx + (Math.random() - 0.5) * 1.5 * dpr,
          y: cy + (Math.random() - 0.5) * 1.5 * dpr,
          vx: Math.cos(ang) * sp * dpr,
          vy: Math.sin(ang) * sp * dpr - (burst ? 0.4 : 0.9) * dpr,
          life: 0,
          maxLife: burst ? 16 + Math.random() * 10 : 13 + Math.random() * 12,
          r: (burst ? 2.6 : 2.0) + Math.random() * 1.6,
          tone: Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : 2,
        });
      }
    };

    const tick = () => {
      frame++;
      const now = performance.now();

      // Emit a spark every other frame only while the pointer moves.
      if (px !== prevX || py !== prevY) {
        spawnAtCursor(frame % 2 === 0 ? 2 : 1);
        lastSeen = now;
      }
      prevX = px;
      prevY = py;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        const t = 1 - s.life / s.maxLife;
        if (t <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx + Math.sin((s.life + s.tone * 7) * 0.4) * 0.18 * dpr;
        s.y += s.vy;
        s.vy += 0.012 * dpr; // slight gravity → crackle fall
        s.vx *= 0.96;
        s.vy *= 0.97;

        const d = s.r * dpr * (0.55 + t * 0.45);
        ctx.globalAlpha = Math.min(1, t * 1.5) * 0.9;
        ctx.drawImage(TONES[s.tone], s.x - d, s.y - d, d * 2, d * 2);
      }
      ctx.globalAlpha = 1;

      // Nothing left to show → stop the loop completely (zero idle cost).
      if (!sparks.length && now - lastSeen > IDLE_STOP_MS) {
        running = false;
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const position = (x: number, y: number) => {
      px = x;
      py = y;
      canvas.style.transform = `translate3d(${x - CANVAS_PX / 2}px, ${y - CANVAS_PX / 2}px, 0)`;
      wake();
    };

    const onMove = (e: PointerEvent) => position(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      position(e.clientX, e.clientY);
      spawnAtCursor(10, true);
      lastSeen = performance.now();
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[85] will-change-transform"
      style={{ width: CANVAS_PX, height: CANVAS_PX, mixBlendMode: "screen" }}
    />
  );
}
