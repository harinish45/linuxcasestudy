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

/** Warm topic palette (mirrors ACCENTS). */
const C = { lvm: "#d97757", nfs: "#6a9bcc", docker: "#788c5d" };

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
        hex: C.lvm,
        metric: `${VG_TOTAL}G raw`,
        fill: 1,
        detail: "Raw hardware. pvcreate stamps an LVM header on each disk so the pool can claim extents.",
      },
      {
        id: "vg",
        title: "Volume group",
        sub: "vgcreate vg_lab",
        icon: <Database className="h-5 w-5" />,
        hex: C.lvm,
        metric: `${vgFree}G free`,
        fill: vgFree / VG_TOTAL,
        detail: "One 12G allocation pool. Growing lv_data spends free extents here — watch the free bar shrink.",
      },
      {
        id: "lv",
        title: "Logical volume",
        sub: "lvextend -L +{g}G -r",
        icon: <Layers className="h-5 w-5" />,
        hex: C.nfs,
        metric: `${lvData}G lv_data`,
        fill: lvData / VG_TOTAL,
        detail: "lvextend grows the LV and the XFS filesystem inside it — online, while it is mounted.",
      },
      {
        id: "nfs",
        title: "NFS export",
        sub: "/srv/nfs/shared",
        icon: <Share2 className="h-5 w-5" />,
        hex: C.nfs,
        metric: `${lvData}G share`,
        fill: lvData / VG_TOTAL,
        detail: "The share lives on the LV — no NFS restart needed; clients just see more space appear.",
      },
      {
        id: "containers",
        title: "Containers",
        sub: "-v /mnt/shared:/data",
        icon: <Container className="h-5 w-5" />,
        hex: C.docker,
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
        <Reveal y={6}>
          <p className="kicker mb-3 flex items-center gap-2">
            <Workflow className="h-4 w-4 text-terracotta" />
            integration pipeline — one stack, one motion
          </p>
        </Reveal>
        <Reveal delay={0.05} y={10}>
          <h1 id="pipeline-title" className="display text-[32px] leading-[1.15] text-foreground md:text-[40px]">
            Grow storage, watch the whole stack react
          </h1>
        </Reveal>
        <Reveal delay={0.1} y={10}>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
            This is how the three chapters connect: disks feed a volume group, logical volumes carry
            the filesystems, NFS serves one of them to the network, and containers bind-mount it.
            Drag the slider — the same <span className="font-mono text-foreground">lvextend</span>{" "}
            command the LVM chapter taught you flows downstream live.
          </p>
        </Reveal>
      </header>

      {/* ── Grow-storage control ─────────────────────────────── */}
      <Reveal y={8}>
        <div className="surface p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="kicker">grow-storage control — lv_data</p>
            <p className="font-mono text-[11.5px]" style={{ color: C.nfs }}>
              +{grow}G · {lvData}G total
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
          <div className="mt-2 flex justify-between font-mono text-[10px] text-text-faint">
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
          <Reveal key={s.id} delay={0.04 * i} y={8} className="relative">
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
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="surface h-full p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ color: s.hex, background: `${s.hex}12` }}
                >
                  {s.icon}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-faint">
                  stage {i + 1}
                </span>
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-foreground">{s.title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{s.sub}</p>
              <p className="mt-2.5 font-mono text-[12.5px] font-medium" style={{ color: s.hex }}>
                {s.metric}
              </p>
              <div className="progress-track mt-2">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.round(s.fill * 100)}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 20 }}
                  style={{ background: s.hex }}
                />
              </div>
              <p className="mt-3 min-h-[72px] text-[11.5px] leading-relaxed text-muted-foreground">
                {s.detail}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      {/* ── The money command + simulated output ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal y={8}>
          <div className="surface flex h-full flex-col gap-4 p-5">
            <p className="kicker">the command this slider runs</p>
            {grow === 0 ? (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Baseline: 5G lv_data on a 12G pool. Drag the slider above and the exact{" "}
                <span className="font-mono text-foreground">lvextend</span> appears here — the same
                one from the LVM cheat sheet, flowing through NFS down to containers.
              </p>
            ) : (
              <>
                <CommandChip
                  cmd={flowCmd}
                  note="grow LV + filesystem online — no unmount, no downtime"
                  accentHex={C.lvm}
                />
                <div className="flex items-start gap-2.5 rounded-xl border border-sage/40 bg-sage-soft px-3.5 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                  <p className="text-[12.5px] leading-relaxed text-text-secondary">
                    Downstream updated: VG free dropped to {vgFree}G, the NFS share now reports{" "}
                    {lvData}G, and containers mounting /mnt/shared see it instantly — zero restarts
                    anywhere.
                  </p>
                </div>
              </>
            )}
          </div>
        </Reveal>

        <Reveal y={8} delay={0.05}>
          <div className="term-panel overflow-hidden !rounded-xl">
            <div className="flex items-center gap-2 border-b border-[#3a3833] bg-[#2b2926] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#c6613f]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#b08968]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#788c5d]/70" />
              <span className="ml-3 font-mono text-[11px] text-[#8f8b80]">lab@z:~ — lvs after grow</span>
            </div>
            <div className="scanlines relative h-[240px] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
              <p className="text-[#8f8b80]"># the state machine, live</p>
              <p className="mt-2 text-[#edeae2]">
                <span className="text-[#e08c6d]">$ </span>
                sudo lvs vg_lab
              </p>
              <p className="text-[#8f8b80]">LV&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Attr&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LSize</p>
              <motion.p
                key={`data-${lvData}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[#c3d1ab]"
              >
                lv_data vg_lab -wi-ao---- {lvData}.00g&nbsp;&nbsp;← grew
              </motion.p>
              <p className="text-[#c9c5ba]">lv_logs vg_lab -wi-ao---- {LV_LOGS}.00g</p>
              <p className="mt-2 text-[#edeae2]">
                <span className="text-[#e08c6d]">$ </span>
                sudo vgs vg_lab
              </p>
              <p className="text-[#8f8b80]">VG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;#PV&nbsp;#LV&nbsp;#SN&nbsp;VSize&nbsp;VFree</p>
              <motion.p
                key={`free-${vgFree}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[#c3d1ab]"
              >
                vg_lab&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;12.00g {vgFree}.00g
              </motion.p>
              <p className="mt-2 text-[#edeae2]">
                <span className="text-[#8ab1d6]">$ </span>
                df -h /mnt/shared
              </p>
              <p className="text-[#c3d1ab]">
                192.168.56.10:/srv/nfs/shared&nbsp;&nbsp;{lvData}G&nbsp;&nbsp;shared
              </p>
              <p className="mt-2 text-[#8f8b80]">
                <span className="text-[#a7b98a]">$</span>
                <span className="term-cursor" />
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Why this matters ─────────────────────────────────── */}
      <Reveal y={8}>
        <div className="surface p-5 md:p-6">
          <p className="kicker flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-terracotta" />
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
              <div key={x.t} className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-[13.5px] font-semibold text-foreground">{x.t}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
