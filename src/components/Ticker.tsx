"use client";

import { TICKER_COMMANDS } from "@/data/commandIndex";

/** Infinite horizontal ticker of lab commands (pauses on hover). */
export default function Ticker() {
  const items = [...TICKER_COMMANDS, ...TICKER_COMMANDS];
  return (
    <div className="relative overflow-hidden border-t border-white/8 bg-[#05070f]/60 py-3 backdrop-blur">
      <div className="ticker-track gap-0">
        {items.map((cmd, i) => (
          <span
            key={i}
            className="flex items-center whitespace-nowrap font-mono text-[11.5px] text-[#8fa2c9]"
          >
            <span className="px-5">{cmd}</span>
            <span className="h-1 w-1 rounded-full bg-[#7c5cff]/70" aria-hidden />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#05070f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#05070f] to-transparent" />
    </div>
  );
}
