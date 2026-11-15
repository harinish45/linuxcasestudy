"use client";

import Counter from "@/components/Counter";
import Reveal from "@/components/Reveal";
import SpotlightCard from "@/components/SpotlightCard";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  delta: string;
  data: number[];
  accentHex: string;
  delay?: number;
}

function Sparkline({ data, accentHex }: { data: number[]; accentHex: string }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 4) + 2;
    const y = h - 4 - ((v - min) / range) * (h - 10);
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w - 2},${h} L2,${h} Z`;
  const [ex, ey] = pts[pts.length - 1];
  const gid = `spark-${accentHex.replace("#", "")}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accentHex} stopOpacity="0.35" />
          <stop offset="1" stopColor={accentHex} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={accentHex} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="2.6" fill={accentHex} style={{ filter: `drop-shadow(0 0 5px ${accentHex})` }} />
    </svg>
  );
}

/** Animated stat card with count-up value and SVG sparkline. */
export default function StatCard({ icon, label, value, decimals = 0, suffix = "", delta, data, accentHex, delay = 0 }: Props) {
  return (
    <Reveal delay={delay} className="h-full">
      <SpotlightCard tilt className="glass h-full rounded-2xl p-5 transition-colors duration-300 hover:bg-white/6">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accentHex}1a`, border: `1px solid ${accentHex}40` }}>
            {icon}
          </span>
          <Sparkline data={data} accentHex={accentHex} />
        </div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#8fa2c9]">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <Counter value={value} decimals={decimals} className="text-3xl font-semibold tracking-tight text-[#e8eefc]" />
          {suffix && <span className="text-sm text-[#8fa2c9]">{suffix}</span>}
        </div>
        <p className="mt-2 font-mono text-[10.5px]" style={{ color: accentHex }}>
          {delta}
        </p>
      </SpotlightCard>
    </Reveal>
  );
}
