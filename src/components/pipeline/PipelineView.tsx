"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  Database,
  Layers,
  Share2,
  Container,
  Workflow,
  Check,
  Zap,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import CommandChip from "@/components/CommandChip";

/** Total VG pool: 3 × 4G disks. */
const VG_TOTAL = 12;
const LV_DATA_BASE = 5;
const LV_LOGS = 3;

interface Stage {
  id: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  hex: string;
  /** headline metric reacting to the slider */
  metric: string;
  /** 0..1 bar fill */
  fill: number;
  detail: string;
}

export default function PipelineView() {
  // How many GB the learner grows lv_data by (0..4).
  const [grow, setGrow] = useState(0);

  const lvData = LV_DATA_BASE + grow;
  const vgFree = VG_TOTAL - lvData - LV_LOGS;

  const stages: Stage[] = useMemo(
    () => [
      {
        id: "disks",
        title: "Physical disks",
        sub: "3 × 4G → pvcreate",
        icon: <HardDrive className="h-5 w-5" />,
        hex: "#7c5cff",
        metric: `${VG_TOTAL}G raw`,
        fill: 1,
        detail: "Raw hardware. pvcreate stamps an LVM header on each disk so the pool can claim extents.",
      },
      {
        id: "vg",
        title: "Volume group",
        sub: "vgcreate vg_lab",
        icon: <Database className="h-5 w-5" />,
        hex: "#7c5cff",
        metric: `${vgFree}G free`,
        fill: vgFree / VG_TOTAL,
        detail: "One 12G allocation pool. Growing lv_data spends free extents here — watch the free bar shrink.",
      },
      {
        id: "lv",
        title: "Logical volume",
        sub: "lvextend -L +{g}G -r",
        icon: <Layers className="h-5 w-5" />,
        hex: "#22d3ee",
        metric: `${lvData}G lv_data`,
        fill: lvData / VG_TOTAL,
        detail: "lvextend grows the LV and the XFS filesystem inside it — online, while it is mounted.",
      },
      {
        id: "nfs",
        title: "NFS export",
        sub: "/srv/nfs/shared",
        icon: <Share2 className="h-5 w-5" />,
        hex: "#22d3ee",
        metric: `${lvData}G share`,
        fill: lvData / VG_TOTAL,
        detail: "The share lives on the LV — no NFS restart needed; clients just see more space appear.",
      },
      {
        id: "containers",
        title: "Containers",
        sub: "-v /mnt/shared:/data",
        icon: <Container className="h-5 w-5" />,
        hex: "#34d399",
        metric: `${lvData}G visible`,
        fill: lvData / VG_TOTAL,
        detail: "Bind-mounted into containers: every service writing to /data instantly gets the new capacity.",
      },
    ],
    [lvData, vgFree]
  );

  const flowCmd = `sudo lvextend -L +${grow}G -r /dev/vg_lab/lv_data`;

  return (
    <div className="flex flex-col gap-10" aria-labelledby="pipeline-title">
      <header>
        <Reveal>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[#7c5cff]">
            <Workflow className="h-4 w-4" />
            integration pipeline — one stack, one motion
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 id="pipeline-title" className="text-3xl font-semibold tracking-tight text-[#e8eefc] md:text-4xl">
            Grow storage, watch the whole stack react
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8fa2c9]">
            This is how the three chapters connect: disks feed a volume group, logical volumes carry the
            filesystems, NFS serves one of them to the network, and containers bind-mount it. Drag the slider —
            the same <span className="font-mono text-[#e8eefc]">lvextend</span> command the LVM chapter taught you
            flows downstream live.
          </p>
        </Reveal>
      </header>

      {/* ── Grow-storage control ─────────────────────────────── */}
      <Reveal>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8fa2c9]">
              grow-storage control — lv_data
            </p>
            <p className="font-mono text-[11px]" style={{ color: "#22d3ee" }}>
              +{grow}G &nbsp;·&nbsp; {lvData}G total
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={grow}
            onChange={(e) => setGrow(Number(e.target.value))}
            className="lab-range mt-4 w-full"
            aria-label="Grow lv_data by gigabytes"
            aria-valuetext={`+${grow} gigabytes`}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-[#64748b]">
            <span>+0G</span>
            <span>+1G</span>
            <span>+2G</span>
            <span>+3G</span>
            <span>+4G</span>
          </div>
        </div>
      </Reveal>

      {/* ── Stage flow ───────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-5">
        {stages.map((s, i) => (
          <Reveal key={s.id} delay={0.05 * i} className="relative">
            {/* connector arrow (desktop) */}
            {i > 0 && (
              <span
                aria-hidden
                className="absolute -left-[13px] top-1/2 hidden h-[2px] w-[12px] -translate-y-1/2 md:block"
                style={{ background: `linear-gradient(90deg, transparent, ${s.hex}88)` }}
              />
            )}
            <motion.div
              key={`${s.id}-${s.metric}`}
              initial={{ opacity: 0.6, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="h-full rounded-2xl border border-white/8 bg-white/4 p-4"
              style={{ boxShadow: `0 0 0 rgba(0,0,0,0)` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-500"
                  style={{ borderColor: `${s.hex}44`, background: `${s.hex}12`, color: s.hex }}
                >
                  {s.icon}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#64748b]">
                  stage {i + 1}
                </span>
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-[#e8eefc]">{s.title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-[#8fa2c9]">{s.sub}</p>
              <p className="mt-2.5 font-mono text-[12.5px] font-medium" style={{ color: s.hex }}>
                {s.metric}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.round(s.fill * 100)}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 20 }}
                  style={{ background: s.hex, boxShadow: `0 0 10px ${s.hex}66` }}
                />
              </div>
              <p className="mt-3 min-h-[72px] text-[11.5px] leading-relaxed text-[#8fa2c9]">{s.detail}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      {/* ── The money command + simulated output ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/8 bg-white/4 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8fa2c9]">
              the command this slider runs
            </p>
            {grow === 0 ? (
              <p className="text-[13px] leading-relaxed text-[#8fa2c9]">
                Baseline: 5G lv_data on a 12G pool. Drag the slider above and the exact{" "}
                <span className="font-mono text-[#e8eefc]">lvextend</span> appears here — the same one from the LVM
                cheat sheet, flowing through NFS down to containers.
              </p>
            ) : (
              <>
                <CommandChip cmd={flowCmd} note="grow LV + filesystem online — no unmount, no downtime" accentHex="#7c5cff" />
                <div className="flex items-start gap-2.5 rounded-xl border border-[#34d39944] bg-[#34d3990d] px-3.5 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
                  <p className="text-[12.5px] leading-relaxed text-[#a7f3d0]">
                    Downstream updated: VG free dropped to {vgFree}G, the NFS share now reports {lvData}G, and
                    containers mounting /mnt/shared see it instantly — zero restarts anywhere.
                  </p>
                </div>
              </>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="glass-strong overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-white/8 bg-white/4 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-[11px] text-[#8fa2c9]">lab@z:~ — lvs after grow</span>
            </div>
            <div className="scanlines relative h-[240px] overflow-y-auto bg-[#05070f]/85 p-4 font-mono text-[12px] leading-relaxed">
              <p className="text-[#8fa2c9]"># the state machine, live</p>
              <p className="mt-2 text-[#e8eefc]">
                <span className="text-[#7c5cff]">$ </span>
                sudo lvs vg_lab
              </p>
              <p className="text-[#8fa2c9]">LV&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Attr&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LSize</p>
              <motion.p key={`data-${lvData}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-[#a7f3d0]">
                lv_data vg_lab -wi-ao---- {lvData}.00g&nbsp;&nbsp;← grew
              </motion.p>
              <p className="text-[#b9c6e4]">lv_logs vg_lab -wi-ao---- {LV_LOGS}.00g</p>
              <p className="mt-2 text-[#e8eefc]">
                <span className="text-[#7c5cff]">$ </span>
                sudo vgs vg_lab
              </p>
              <p className="text-[#8fa2c9]">VG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;#PV&nbsp;#LV&nbsp;#SN&nbsp;VSize&nbsp;VFree</p>
              <motion.p key={`free-${vgFree}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-[#a7f3d0]">
                vg_lab&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;12.00g {vgFree}.00g
              </motion.p>
              <p className="mt-2 text-[#e8eefc]">
                <span className="text-[#22d3ee]">$ </span>
                df -h /mnt/shared
              </p>
              <p className="text-[#a7f3d0]">
                192.168.56.10:/srv/nfs/shared&nbsp;&nbsp;{lvData}G&nbsp;&nbsp;shared
              </p>
              <p className="mt-2 text-[#8fa2c9]">
                <span className="text-[#34d399]">$</span>
                <span className="term-cursor" />
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Why this matters ─────────────────────────────────── */}
      <Reveal>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 md:p-6">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#8fa2c9]">
            <Zap className="h-3.5 w-3.5 text-[#fbbf24]" />
            why this pipeline matters
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                t: "Storage is the floor",
                b: "Containers and shares are only as big as the LV beneath them. LVM means you never re-partition to grow.",
              },
              {
                t: "NFS is the bridge",
                b: "One export turns a local LV into fleet-wide storage — every machine sees the same directory.",
              },
              {
                t: "Containers ride on top",
                b: "Bind-mount the share and services scale horizontally without caring where the bytes physically live.",
              },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <p className="text-[13.5px] font-semibold text-[#e8eefc]">{x.t}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8fa2c9]">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
