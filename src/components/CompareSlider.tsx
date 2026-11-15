"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

/**
 * Before/after drag slider: fixed partitions vs the LVM pool.
 * Pointer-draggable + keyboard accessible (role="slider").
 */
export default function CompareSlider() {
  const [pos, setPos] = useState(52);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(2, Math.min(98, p)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    update(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging) update(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(2, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(98, p + 4));
  };

  return (
    <div
      ref={ref}
      className="glass relative h-[340px] touch-none select-none overflow-hidden rounded-2xl md:h-[380px]"
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerDown={onPointerDown}
      data-cursor="drag"
      data-cursor-label="drag"
    >
      {/* AFTER — LVM pool (base layer) */}
      <div className="absolute inset-0 p-6 md:p-8" aria-hidden>
        <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#34d399]">
          After · LVM pool
        </p>
        <div className="mx-auto flex h-[210px] max-w-md flex-col gap-1.5 rounded-xl border border-[#7c5cff55] bg-[#7c5cff0d] p-2">
          <div className="flex flex-1 items-center justify-between rounded-lg bg-[#8b6bff33] px-3 font-mono text-[11px] text-[#e8eefc]">
            lv_data · XFS <span>7.0G (was 5.0)</span>
          </div>
          <div className="flex h-[26%] items-center justify-between rounded-lg bg-[#5b46b033] px-3 font-mono text-[11px] text-[#e8eefc]">
            lv_logs · ext4 <span>2.0G</span>
          </div>
          <div className="flex h-[20%] items-center justify-between rounded-lg border border-dashed border-[#34d39966] bg-[#34d39914] px-3 font-mono text-[11px] text-[#34d399]">
            free pool <span>9.0G — allocates anywhere</span>
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-[#8fa2c9]">
          resize online · extents shared · snapshot before every risky deploy
        </p>
      </div>

      {/* BEFORE — fixed partitions (clipped overlay) */}
      <div
        className="absolute inset-0 p-6 md:p-8"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[#0a0c18]/92" />
        <div className="relative">
          <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#f87171]">
            Before · fixed partitions
          </p>
          <div className="mx-auto flex h-[210px] max-w-md flex-col gap-1.5">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-[#f8717144] bg-[#f8717114] px-3 font-mono text-[11px] text-[#e8eefc]">
              sda1 · / <span>4G locked</span>
            </div>
            <div className="flex h-[24%] items-center justify-between rounded-lg border border-dashed border-[#f8717155] bg-[#f8717108] px-3 font-mono text-[11px] text-[#f87171]">
              unused gap <span>2.1G — unreachable</span>
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-[#f8717144] bg-[#f8717114] px-3 font-mono text-[11px] text-[#e8eefc]">
              sda2 · /srv <span>5G locked · 92% full</span>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-[#8fa2c9]">
            resize = unmount → backup → repartition → restore · 4h window
          </p>
        </div>
      </div>

      {/* handle */}
      <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -translate-x-1/2 border-l border-white/60 [box-shadow:0_0_18px_rgba(124,92,255,0.6)]" />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare fixed partitions with the LVM pool"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-white/30 bg-[#0a0e1c] shadow-[0_0_24px_rgba(124,92,255,0.55)]"
        >
          <ChevronsLeftRight className="h-4 w-4 text-[#e8eefc]" />
        </div>
      </div>
    </div>
  );
}
