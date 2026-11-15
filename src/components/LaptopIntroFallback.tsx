"use client";

import { useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";

/**
 * Shared overlay chrome for the intro: logo, status line, Enter/Skip controls.
 * Used by both the three.js intro and the SVG fallback.
 */
export function IntroChrome({
  ready,
  reduced,
  onEnter,
  onSkip,
  entering,
}: {
  ready: boolean;
  reduced: boolean;
  onEnter: () => void;
  onSkip: () => void;
  entering?: boolean;
}) {
  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 py-5 md:px-8">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#8fa2c9] md:text-xs md:tracking-[0.25em]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#7c5cff] shadow-[0_0_12px_rgba(124,92,255,0.9)]" />
          clu<span className="hidden md:inline">&nbsp;/ case-study lab</span>
        </span>
        <button
          onClick={onSkip}
          disabled={entering}
          className="pointer-events-auto shrink-0 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] text-[#8fa2c9] transition-colors hover:border-white/30 hover:text-[#e8eefc] disabled:opacity-40 md:text-[11px]"
        >
          skip intro <span className="ml-1 hidden opacity-60 sm:inline">esc</span>
        </button>
      </header>

      <div
        className={`absolute inset-x-0 bottom-[7%] z-10 flex flex-col items-center gap-4 px-4 text-center transition-all duration-700 ${
          ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-hidden={!ready}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#8fa2c9]">
          {reduced ? "lab environment ready" : "boot complete — lab environment ready"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onEnter}
            disabled={entering}
            data-cursor="enter"
            data-cursor-label="enter"
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border border-[#7c5cff66] bg-[#7c5cff1a] px-7 py-3.5 text-sm font-semibold text-[#e8eefc] shadow-[0_0_32px_rgba(124,92,255,0.35)] transition-all hover:border-[#7c5cff] hover:bg-[#7c5cff2e] hover:shadow-[0_0_48px_rgba(124,92,255,0.5)] disabled:opacity-50"
          >
            <Power className="h-4 w-4 text-[#a78bfa]" />
            Enter the lab
            <kbd className="ml-1 rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-[#8fa2c9]">
              ⏎
            </kbd>
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * SVG laptop intro for phones / reduced-motion / low-power devices.
 * Same choreography: lid opens, screen boots, then the lab is ready.
 */
export default function LaptopIntroFallback({
  onDone,
  reduced,
}: {
  onDone: () => void;
  reduced: boolean;
}) {
  const [boot, setBoot] = useState(reduced ? 1 : 0);
  const [ready, setReady] = useState(reduced);
  const [entering, setEntering] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setBoot(0.35), 700));
    timers.push(window.setTimeout(() => setBoot(0.7), 1500));
    timers.push(window.setTimeout(() => setBoot(1), 2300));
    timers.push(window.setTimeout(() => setReady(true), 2600));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      window.sessionStorage.setItem("clu-intro-v2", "1");
    } catch {
      /* private mode — fine */
    }
    onDone();
  };

  const enter = () => {
    setEntering(true);
    window.setTimeout(finish, 700);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "Enter") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[95] flex flex-col overflow-hidden bg-[#05070f]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 44% at 50% 42%, rgba(124,92,255,0.14) 0%, rgba(34,211,238,0.05) 45%, transparent 74%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-all duration-700"
        style={{ filter: entering ? "brightness(2.2) blur(8px)" : undefined }}
      >
        <div className="flex h-full w-full items-center justify-center [perspective:1200px]">
          <svg
            viewBox="0 0 460 320"
            className="w-[min(78vw,560px)] drop-shadow-[0_30px_60px_rgba(124,92,255,0.25)]"
            role="img"
            aria-label="Laptop opening to boot the lab"
          >
            {/* lid — rotates open around the hinge */}
            <g
              transform="translate(70 26)"
              style={{
                transformOrigin: "230px 268px",
                transformBox: "view-box",
                animation: reduced
                  ? undefined
                  : "intro-lid 1.5s cubic-bezier(0.22, 1.4, 0.3, 1) 0.35s forwards",
                transform: reduced ? "none" : "rotateX(84deg)",
              }}
            >
              <rect x="0" y="0" width="320" height="212" rx="14" fill="#0d1428" stroke="#2a3554" strokeWidth="2" />
              <rect x="12" y="12" width="296" height="176" rx="7" fill="#05070f" stroke="#1b2542" />
              {/* screen content fades in with boot progress */}
              <g opacity={boot} style={{ transition: "opacity 0.9s ease" }}>
                <text x="160" y="78" textAnchor="middle" fill="#e8eefc" fontSize="21" fontWeight="600" fontFamily="var(--font-inter), sans-serif">
                  Comprehensive Linux
                </text>
                <text x="160" y="102" textAnchor="middle" fill="#8fa2c9" fontSize="11" letterSpacing="3" fontFamily="var(--font-jbmono), monospace">
                  LVM · NFS · CONTAINERS
                </text>
                <rect x="112" y="122" width="96" height="3" rx="1.5" fill="#7c5cff" opacity="0.8" />
                <text x="160" y="152" textAnchor="middle" fill="#34d399" fontSize="10.5" fontFamily="var(--font-jbmono), monospace">
                  $ boot lab --verified ✓
                </text>
              </g>
              <circle cx="160" cy="202" r="4" fill={boot > 0.7 ? "#34d399" : "#7c5cff"} className={boot < 1 ? "led" : undefined} />
            </g>
            {/* base / keyboard deck */}
            <g transform="translate(46 238)">
              <path d="M0 0 L368 0 L392 62 Q394 70 384 70 L-16 70 Q-26 70 -24 62 Z" fill="#10162c" stroke="#2a3554" strokeWidth="2" />
              <path d="M148 62 L220 62 L216 52 L152 52 Z" fill="#0a0e1c" stroke="#1b2542" />
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 13 }).map((_, c) => (
                  <rect
                    key={`${r}-${c}`}
                    x={40 + c * 22 + (r % 2) * 6}
                    y={10 + r * 11}
                    width="17"
                    height="7"
                    rx="2"
                    fill="#161e3a"
                    stroke="#232d4d"
                    strokeWidth="0.6"
                  />
                ))
              )}
            </g>
          </svg>
        </div>
      </div>

      <style>{`@keyframes intro-lid { from { transform: rotateX(84deg); } to { transform: rotateX(6deg); } }`}</style>

      <IntroChrome ready={ready} reduced={reduced} onEnter={enter} onSkip={finish} entering={entering} />
    </div>
  );
}

