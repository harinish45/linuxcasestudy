"use client";

/**
 * Static SVG diagram posters — rendered instead of the WebGL canvas on
 * phones, low-core devices, or machines without WebGL.
 */

const MONO = { fontFamily: "var(--font-jbmono), monospace" } as const;

export function RackPoster() {
  return (
    <svg viewBox="0 0 420 300" className="h-full w-full" role="img" aria-label="Server rack diagram">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#161e3a" />
          <stop offset="1" stopColor="#10162c" />
        </linearGradient>
      </defs>
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i} transform={`translate(90 ${30 + i * 42})`}>
          <rect width="240" height="34" rx="6" fill="url(#rg)" stroke="rgba(255,255,255,0.14)" />
          <rect x="14" y="12" width="120" height="10" rx="3" fill="#05070f" stroke="rgba(255,255,255,0.15)" />
          {[0, 1, 2, 3].map((k) => (
            <rect
              key={k}
              className="led"
              style={{ animationDelay: `${k * 0.3 + i * 0.2}s` }}
              x={190 + k * 12}
              y={14}
              width="7"
              height="7"
              rx="1.5"
              fill="#7c5cff"
            />
          ))}
        </g>
      ))}
      <rect x="72" y="18" width="8" height="252" rx="3" fill="#1a2240" />
      <rect x="340" y="18" width="8" height="252" rx="3" fill="#1a2240" />
      <text x="210" y="292" textAnchor="middle" fill="#8fa2c9" fontSize="12" style={MONO}>
        rack-01 · 7U · LEDs live
      </text>
    </svg>
  );
}

export function LvmPoster() {
  return (
    <svg viewBox="0 0 460 320" className="h-full w-full" role="img" aria-label="LVM diagram: PVs to VG to LVs">
      {[
        [40, "sdb", 30],
        [40, "sdc", 130],
        [40, "sdd", 230],
      ].map(([y, label], i) => (
        <g key={i} transform={`translate(20 ${y as number})`}>
          <rect width="90" height="56" rx="10" fill="#161e3a" stroke="#7c5cff55" />
          <circle cx="45" cy="28" r="18" fill="none" stroke="#7c5cff" strokeWidth="2" className="led" style={{ animationDelay: `${i * 0.4}s` }} />
          <text x="45" y="70" textAnchor="middle" fill="#8fa2c9" fontSize="10" style={MONO}>
            {label} · 4G
          </text>
        </g>
      ))}
      <path d="M115 60 C 150 60 150 155 185 155 M115 160 C 150 160 150 165 185 165 M115 260 C 150 260 150 175 185 175" stroke="#7c5cff66" fill="none" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="190" y="110" width="110" height="110" rx="12" fill="#7c5cff22" stroke="#7c5cff" />
      <text x="245" y="170" textAnchor="middle" fill="#c4b5fd" fontSize="12" style={MONO}>
        vg_lab
      </text>
      <text x="245" y="188" textAnchor="middle" fill="#8fa2c9" fontSize="10" style={MONO}>
        12G pool
      </text>
      <path d="M300 140 L 340 110 M300 190 L 340 220" stroke="#7c5cff66" strokeWidth="1.5" strokeDasharray="4 4" />
      <g transform="translate(345 88)">
        <rect width="95" height="44" rx="8" fill="#8b6bff33" stroke="#8b6bff" />
        <text x="47" y="19" textAnchor="middle" fill="#e8eefc" fontSize="10.5" style={MONO}>
          lv_data
        </text>
        <text x="47" y="34" textAnchor="middle" fill="#c4b5fd" fontSize="9.5" style={MONO}>
          XFS · 5G
        </text>
      </g>
      <g transform="translate(345 200)">
        <rect width="95" height="44" rx="8" fill="#5b46b033" stroke="#a78bfa" />
        <text x="47" y="19" textAnchor="middle" fill="#e8eefc" fontSize="10.5" style={MONO}>
          lv_logs
        </text>
        <text x="47" y="34" textAnchor="middle" fill="#a78bfa" fontSize="9.5" style={MONO}>
          ext4 · 2G
        </text>
      </g>
    </svg>
  );
}

export function NfsPoster() {
  return (
    <svg viewBox="0 0 460 320" className="h-full w-full" role="img" aria-label="NFS diagram: one server, three clients">
      <rect x="175" y="120" width="110" height="90" rx="14" fill="#22d3ee18" stroke="#22d3ee" />
      <text x="230" y="160" textAnchor="middle" fill="#e8eefc" fontSize="12" style={MONO}>
        n10
      </text>
      <text x="230" y="180" textAnchor="middle" fill="#22d3ee" fontSize="10" style={MONO}>
        /srv/nfs/shared
      </text>
      {[
        [70, 40, "client-1"],
        [70, 230, "client-2"],
        [330, 135, "client-3"],
      ].map(([x, y, label], i) => (
        <g key={i} transform={`translate(${x as number} ${y as number})`}>
          <rect width="82" height="56" rx="10" fill="#161e3a" stroke="#22d3ee44" />
          <text x="41" y="33" textAnchor="middle" fill="#8fa2c9" fontSize="10.5" style={MONO}>
            {label}
          </text>
        </g>
      ))}
      <path d="M152 96 C 190 120 190 150 172 150 M152 258 C 195 240 200 200 175 185 M328 163 L 290 168" stroke="#22d3ee55" fill="none" strokeWidth="1.6" strokeDasharray="3 5" />
      {[
        [150, 105],
        [150, 250],
        [322, 158],
      ].map(([x, y], i) => (
        <circle key={i} cx={x as number} cy={y as number} r="5" fill="#22d3ee" className="led" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <text x="230" y="300" textAnchor="middle" fill="#8fa2c9" fontSize="11" style={MONO}>
        rw,sync,root_squash · 192.168.56.0/24 · tcp/2049
      </text>
    </svg>
  );
}

export function ContainerPoster() {
  return (
    <svg viewBox="0 0 460 320" className="h-full w-full" role="img" aria-label="VM vs container boot race diagram">
      <text x="80" y="30" fill="#8fa2c9" fontSize="11" style={MONO}>
        LANE A · VM · 18s
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(30 ${50 + i * 74})`}>
          <rect width="66" height="56" rx="8" fill="#2a3147" stroke="#475069" />
          <rect x="14" y="22" width="38" height="6" rx="2" fill="#05070f" />
          <circle cx="52" cy="14" r="9" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="44" strokeDashoffset="16" className="led" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      ))}
      <text x="300" y="30" fill="#34d399" fontSize="11" style={MONO}>
        LANE B · Containers · 0.2s
      </text>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          className="led"
          style={{ animationDelay: `${i * 0.18}s` }}
          x={262 + (i % 4) * 52}
          y={44 + Math.floor(i / 4) * 52}
          width="36"
          height="36"
          rx="6"
          fill="#34d39926"
          stroke="#34d399"
        />
      ))}
      <line x1="222" y1="40" x2="222" y2="270" stroke="rgba(255,255,255,0.14)" />
      <text x="230" y="300" textAnchor="middle" fill="#8fa2c9" fontSize="11" style={MONO}>
        18s vs 0.2s — the whole argument, drawn.
      </text>
    </svg>
  );
}
