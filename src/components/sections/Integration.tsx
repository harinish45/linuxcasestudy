"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container, Cylinder, Database, FolderGit2, HardDrive, Monitor } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/components/providers/ToastProvider";

const VIOLET = "#7c5cff";
const CYAN = "#22d3ee";
const EMERALD = "#34d399";

/** The full stack composed: LVM pool → LV → NFS export → clients → Docker volume → container. */
export default function Integration() {
  const { push } = useToast();
  const [grow, setGrow] = useState(30); // 0..100 → +0..+4G

  const lvSize = 5 + (grow / 100) * 4;
  const nfsDf = 5 + (grow / 100) * 2;
  const dockerFree = 4.2 + (grow / 100) * 2;
  const ringC = 2 * Math.PI * 15;
  const ringP = 0.55 + (grow / 100) * 0.45;

  const nodes = [
    {
      icon: <HardDrive className="h-4 w-4" style={{ color: VIOLET }} />,
      accent: VIOLET,
      title: "LVM pool · vg_lab",
      body: (
        <div className="flex flex-wrap items-center gap-2">
          {["sdb", "sdc", "sdd"].map((d, i) => (
            <span key={d} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-[#8fa2c9]">
              <span className="led h-1.5 w-1.5 rounded-full" style={{ background: VIOLET, animationDelay: `${i * 0.4}s` }} />
              {d} · 4G
            </span>
          ))}
          {grow > 55 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 rounded-lg border border-[#34d39944] bg-[#34d39914] px-2.5 py-1.5 font-mono text-[11px] text-[#34d399]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" /> sde · 4G hot-added
            </motion.span>
          )}
        </div>
      ),
    },
    {
      icon: <Database className="h-4 w-4" style={{ color: VIOLET }} />,
      accent: VIOLET,
      title: "lv_data · XFS",
      body: (
        <div>
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`, boxShadow: `0 0 14px ${VIOLET}66` }}
              animate={{ width: `${28 + (grow / 100) * 68}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
          <p className="font-mono text-[11.5px] text-[#8fa2c9]">
            size: <span className="text-[#e8eefc]">{lvSize.toFixed(1)}G</span> · mounted /mnt/lab/data · grown online
          </p>
        </div>
      ),
    },
    {
      icon: <FolderGit2 className="h-4 w-4" style={{ color: CYAN }} />,
      accent: CYAN,
      title: "NFS export · n10:/srv/nfs/shared",
      body: (
        <p className="font-mono text-[11.5px] text-[#8fa2c9]">
          df -h → <span className="text-[#e8eefc]">{nfsDf.toFixed(1)}G</span> visible on every client · rw,sync,root_squash · tcp/2049
        </p>
      ),
    },
    {
      icon: <Monitor className="h-4 w-4" style={{ color: CYAN }} />,
      accent: CYAN,
      title: "3 × lab clients",
      body: (
        <div className="flex gap-2">
          {[1, 2, 3].map((c) => (
            <span key={c} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-[#8fa2c9]">
              client-{c} <span className="text-[#34d399]">mounted</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: <Cylinder className="h-4 w-4" style={{ color: EMERALD }} />,
      accent: EMERALD,
      title: "Docker named volume · lab_data",
      body: (
        <div className="flex items-center gap-4">
          <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden>
            <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
            <circle
              cx="19" cy="19" r="15" fill="none"
              stroke={EMERALD} strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringC * (1 - ringP)}
              transform="rotate(-90 19 19)"
              style={{ transition: "stroke-dashoffset 0.35s ease", filter: `drop-shadow(0 0 6px ${EMERALD}88)` }}
            />
            <text x="19" y="23" textAnchor="middle" fontSize="9.5" fill="#b9c6e4" fontFamily="monospace">
              {Math.round(ringP * 100)}%
            </text>
          </svg>
          <p className="font-mono text-[11.5px] text-[#8fa2c9]">
            container free space: <span className="text-[#e8eefc]">{dockerFree.toFixed(1)}G</span> · backed by the same VG
          </p>
        </div>
      ),
    },
    {
      icon: <Container className="h-4 w-4" style={{ color: EMERALD }} />,
      accent: EMERALD,
      title: "container · web · lab-app:1.0",
      body: (
        <p className="font-mono text-[11.5px] text-[#8fa2c9]">
          Up 2 minutes · 0.2s boot · <span className="text-[#e8eefc]">/data</span> write survives <span className="text-[#e8eefc]">docker rm -f</span>
        </p>
      ),
    },
  ];

  return (
    <section id="pipeline" className="relative pt-10">
      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <SectionHeading
          kicker="Integration — the pipeline"
          title="Three technologies, one flow"
          description="Scroll-scrub each stage and the whole chain reacts: grow the LV at the top and the NFS df readout, client mounts and the container's free-space ring all move with it. This is the composition the lab was built to prove."
          accentHex={VIOLET}
        />

        <Reveal className="glass relative overflow-hidden rounded-3xl p-6 md:p-10">
          <style>{`
            @keyframes pipeline-flow {
              0% { top: 0%; opacity: 0; }
              8% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .particle {
              position: absolute;
              width: 7px; height: 7px; border-radius: 9999px;
              background: ${CYAN};
              box-shadow: 0 0 10px ${CYAN}, 0 0 22px ${CYAN}66;
              transform: translateX(-50%);
              animation: pipeline-flow 4.6s linear infinite;
            }
          `}</style>

          <div className="relative mx-auto max-w-xl">
            {/* rail + particles */}
            <div aria-hidden className="absolute bottom-2 left-[21px] top-2 w-px bg-gradient-to-b from-[#7c5cff] via-[#22d3ee] to-[#34d399] opacity-45" />
            {[0, 1, 2].map((i) => (
              <span key={i} className="particle left-[22px]" style={{ animationDelay: `${i * 1.5}s` }} />
            ))}

            <div className="flex flex-col gap-6">
              {nodes.map((n, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <div className="relative flex gap-4">
                    <span
                      className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border bg-[#0a0e1c]"
                      style={{ borderColor: `${n.accent}55`, boxShadow: `0 0 18px ${n.accent}30` }}
                    >
                      {n.icon}
                    </span>
                    <div className="glass min-w-0 flex-1 rounded-xl p-4">
                      <p className="mb-2 font-mono text-[12px] font-medium text-[#e8eefc]">{n.title}</p>
                      {n.body}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* grow-storage slider */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="glass-strong rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="grow" className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#8fa2c9]">
                  drag to grow storage
                </label>
                <span className="font-mono text-[12px] text-[#34d399]">
                  +{(grow / 25).toFixed(2)}G to the pool
                </span>
              </div>
              <input
                id="grow"
                type="range"
                min={0}
                max={100}
                value={grow}
                onChange={(e) => setGrow(Number(e.target.value))}
                onPointerUp={() =>
                  push({
                    title: "lvextend -L +2G -r",
                    description: "Pool grown — every downstream readout updated live.",
                    tone: "success",
                  })
                }
                className="lab-range w-full"
                aria-label="Grow the LVM pool and watch downstream reactions"
                data-cursor="drag"
                data-cursor-label="drag"
              />
              <p className="mt-3 text-[12px] leading-relaxed text-[#8fa2c9]">
                LV bar grows → NFS df readout +2G → container free-space ring expands. No unmounts anywhere in
                the chain — that&apos;s the point of the pool.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
