"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HardDrive, Layers, Database, Camera, Undo2, Plus, Check, MousePointerClick } from "lucide-react";

const V = "#d97757";
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

interface Disk {
  id: string;
  size: number;
}

/** 1 visual cell = 64 extents (256 MiB). The grid makes "extents" tangible. */
const EXT_PER_CELL = 64;

interface Selection {
  kind: "pv" | "seg" | "extent";
  title: string;
  detail: string;
  cmd?: string;
}

/**
 * LVM interactive diagram — full width, built for clicking:
 * disks → pool (with a clickable extent map) → slices.
 * Buttons: add a 4th disk (live extend) · snapshot · rollback.
 */
export default function LvmVisual() {
  const reduced = useReducedMotion();
  const [disks, setDisks] = useState<Disk[]>([
    { id: "sdb", size: 4 },
    { id: "sdc", size: 4 },
    { id: "sdd", size: 4 },
  ]);
  const [lvData, setLvData] = useState(5); // GB
  const [extending, setExtending] = useState(false);
  const [extended, setExtended] = useState(false);
  const [snapshot, setSnapshot] = useState<"none" | "taking" | "taken" | "merging">("none");
  const [cmd, setCmd] = useState("sudo vgcreate vg_lab /dev/sdb /dev/sdc /dev/sdd");
  const [sel, setSel] = useState<Selection | null>({
    kind: "seg",
    title: "vg_lab — pooled space",
    detail:
      "Three disks pooled into one allocation space. Click any disk, pool segment or extent cell below to inspect it.",
    cmd: "sudo pvs && sudo vgs && sudo lvs",
  });
  const token = useRef(0);

  const vgTotal = disks.reduce((a, d) => a + d.size, 0);
  const logsSize = 2;
  const usedInData = Math.min(lvData, Math.round(lvData * 0.72));

  useEffect(() => () => { token.current++; }, []);

  const extend = async () => {
    if (extended || extending) return;
    const my = ++token.current;
    setExtending(true);
    setCmd("sudo pvcreate /dev/sde  # new 4G disk");
    await sleep(500);
    if (token.current !== my) return;
    setDisks((d) => [...d, { id: "sde", size: 4 }]);
    await sleep(650);
    if (token.current !== my) return;
    setCmd("sudo lvextend -L +2G -r /dev/vg_lab/lv_data");
    await sleep(500);
    if (token.current !== my) return;
    setLvData(7);
    await sleep(400);
    if (token.current !== my) return;
    setExtending(false);
    setExtended(true);
    setCmd("sudo lvs  # lv_data: 5G → 7G, grown online");
    setSel({
      kind: "seg",
      title: "lv_data grew online — 5G → 7G",
      detail: "lvextend -L +2G -r grew the volume AND the XFS filesystem in one step, while mounted. The extent map above refilled live.",
      cmd: "sudo lvextend -L +2G -r /dev/vg_lab/lv_data",
    });
  };

  const takeSnapshot = async () => {
    if (snapshot !== "none") return;
    const my = ++token.current;
    setSnapshot("taking");
    setCmd("sudo lvcreate -s -n lv_data_snap -L 1G vg_lab/lv_data");
    await sleep(700);
    if (token.current !== my) return;
    setSnapshot("taken");
    await sleep(900);
    if (token.current !== my) return;
    setSnapshot("merging");
    setCmd("sudo lvconvert --merge vg_lab/lv_data_snap");
    await sleep(800);
    if (token.current !== my) return;
    setSnapshot("none");
    setCmd("rollback complete — sha256 verified byte-identical");
    setSel({
      kind: "seg",
      title: "rollback complete — byte-identical",
      detail: "The snapshot stored only blocks that changed (copy-on-write), then lvconvert --merge replayed them back. Verified with sha256sum.",
      cmd: "sudo lvconvert --merge vg_lab/lv_data_snap",
    });
    await sleep(1600);
    if (token.current !== my) return;
    setCmd("sudo lvs");
  };

  /* extent map math — deterministic, no rounding surprises */
  const totalCells = Math.floor((vgTotal * 1024) / 256); // 256 MiB per cell
  const dataCells = Math.floor((lvData * 1024) / 256);
  const logsCells = Math.floor((logsSize * 1024) / 256);

  const pickPv = (d: Disk) =>
    setSel({
      kind: "pv",
      title: `PV /dev/${d.id} — ${d.size}G raw disk`,
      detail: `Initialised by pvcreate, pooled into vg_lab. The disk itself holds no filesystem — LVM records its ${Math.floor((d.size * 1024) / 4)} extents as available to the group.`,
      cmd: `sudo pvdisplay /dev/${d.id}`,
    });

  const pickSeg = (kind: "data" | "logs" | "free") => {
    if (kind === "data")
      setSel({
        kind: "seg",
        title: `lv_data — ${lvData}G · XFS`,
        detail: `The app dataset. Grows online with lvextend -r (XFS is grow-only). Currently ${usedInData}G used. Backed by the first ${Math.floor((lvData * 1024) / 4)} extents of the pool.`,
        cmd: "sudo lvextend -L +1G -r /dev/vg_lab/lv_data",
      });
    else if (kind === "logs")
      setSel({
        kind: "seg",
        title: "lv_logs — 2G · ext4",
        detail: "Write-heavy logs on ext4 — the filesystem that CAN shrink if the pool ever needs the space back (lvreduce -r).",
        cmd: "sudo lvreduce -L -1G -r /dev/vg_lab/lv_logs",
      });
    else {
      const free = vgTotal - lvData - logsSize;
      setSel({
        kind: "seg",
        title: `free pool — ${free}G unallocated`,
        detail: `${free}G of extents waiting. Any lvcreate or lvextend spends from here — that is the whole point of pooling.`,
        cmd: "sudo vgs",
      });
    }
  };

  const pickExtent = (i: number) => {
    const start = i * EXT_PER_CELL;
    const end = start + EXT_PER_CELL - 1;
    if (i < dataCells)
      setSel({
        kind: "extent",
        title: `extents #${start}–#${end} → lv_data`,
        detail: `This 256 MiB cell belongs to lv_data (XFS). GB offset: ${(i / 4).toFixed(2)}G into the volume.`,
        cmd: "sudo lvs -o +devices",
      });
    else if (i < dataCells + logsCells)
      setSel({
        kind: "extent",
        title: `extents #${start}–#${end} → lv_logs`,
        detail: "This 256 MiB cell belongs to lv_logs (ext4).",
        cmd: "sudo lvs -o +devices",
      });
    else
      setSel({
        kind: "extent",
        title: `extents #${start}–#${end} → FREE`,
        detail: "Unallocated. The next lvcreate or lvextend claims cells like this one.",
        cmd: "sudo vgs",
      });
  };

  const segW = (gb: number) => `${(gb / vgTotal) * 100}%`;

  return (
    <div className="flex flex-col gap-6">
      {/* PV row — clickable disks */}
      <div>
        <p className="kicker mb-3 flex items-center gap-2 text-[12px]">
          <HardDrive className="h-4 w-4" style={{ color: V }} /> physical volumes — raw disks
        </p>
        <div className="flex flex-wrap gap-2.5">
          <AnimatePresence>
            {disks.map((d) => (
              <motion.button
                key={d.id}
                layout
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                onClick={() => pickPv(d)}
                aria-label={`Inspect physical volume /dev/${d.id}`}
                className="group flex items-center gap-2.5 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 transition-colors duration-150 hover:border-terracotta/50 hover:bg-secondary"
              >
                <span className="led h-2 w-2 rounded-full" style={{ background: V }} />
                <span className="font-mono text-[13.5px] text-foreground">/dev/{d.id}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{d.size}G</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* flow arrows */}
      <div className="flex items-center gap-2.5 px-6 text-muted-foreground" aria-hidden>
        <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="opacity-70">
          <path d="M9 0v18" stroke={V} strokeWidth="1.5" />
          <path d="M4 16l5 6 5-6" stroke={V} strokeWidth="1.5" fill="none" />
        </svg>
        <span className="font-mono text-[11px]">pvcreate · vgcreate · pooled extents</span>
      </div>

      {/* VG pool — taller, clickable segments */}
      <div>
        <p className="kicker mb-3 flex items-center gap-2 text-[12px]">
          <Layers className="h-4 w-4" style={{ color: V }} /> volume group — vg_lab ({vgTotal}G)
        </p>
        <div className="flex h-16 w-full overflow-hidden rounded-xl border border-border bg-secondary md:h-20">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="h-full cursor-pointer"
            style={{
              width: segW(lvData),
              background: `linear-gradient(90deg, ${V}cc, ${V}99)`,
              borderRight: "1px dashed rgba(255,255,255,0.35)",
            }}
            onClick={() => pickSeg("data")}
            role="button"
            aria-label={`lv_data segment, ${lvData}G`}
          />
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="h-full cursor-pointer"
            style={{
              width: segW(logsSize),
              background: `linear-gradient(90deg, ${V}66, ${V}44)`,
              borderRight: "1px dashed rgba(255,255,255,0.35)",
            }}
            onClick={() => pickSeg("logs")}
            role="button"
            aria-label="lv_logs segment, 2G"
          />
          <div
            className="flex-1 cursor-pointer"
            style={{ background: "var(--surface-strong)" }}
            onClick={() => pickSeg("free")}
            role="button"
            aria-label="free pool segment"
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[11px] text-text-faint">
          <span>
            lv_data {lvData}G · lv_logs {logsSize}G · free {Math.max(vgTotal - lvData - logsSize, 0)}G
          </span>
          <span>4 MiB extents</span>
        </div>
      </div>

      {/* extent map — click cells to see who owns what */}
      <div>
        <p className="kicker mb-3 flex items-center gap-2 text-[12px]">
          <MousePointerClick className="h-4 w-4" style={{ color: V }} /> extent map — 1 cell ≈ 64 extents (256 MiB)
        </p>
        <div className="grid grid-cols-12 gap-1.5 sm:grid-cols-16 md:grid-cols-16" role="group" aria-label="Extent allocation map">
          {Array.from({ length: totalCells }, (_, i) => {
            const owner = i < dataCells ? "data" : i < dataCells + logsCells ? "logs" : "free";
            const bg = owner === "data" ? V : owner === "logs" ? `${V}77` : "var(--surface-strong)";
            return (
              <motion.button
                key={`${i}-${vgTotal}`}
                initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.008, 0.4), duration: 0.2 }}
                onClick={() => pickExtent(i)}
                aria-label={`Extents ${i * EXT_PER_CELL} to ${i * EXT_PER_CELL + EXT_PER_CELL - 1}, ${owner}`}
                className="h-6 rounded-md transition-transform duration-100 hover:scale-110 md:h-7"
                style={{ background: bg, border: owner === "free" ? "1px dashed var(--border)" : "none" }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px] text-text-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: V }} /> lv_data
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `${V}77` }} /> lv_logs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-border" style={{ background: "var(--surface-strong)" }} /> free
          </span>
        </div>
      </div>

      {/* LV row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => pickSeg("data")}
          className="rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors duration-150 hover:border-terracotta/40 md:p-5"
        >
          <p className="flex items-center justify-between gap-2 font-mono text-[13.5px] text-foreground">
            <span className="flex min-w-0 items-center gap-2">
              <Database className="h-4 w-4 shrink-0" style={{ color: V }} />
              <span className="truncate">/dev/vg_lab/lv_data</span>
            </span>
            <motion.span
              key={lvData}
              initial={reduced ? {} : { scale: 1.25 }}
              animate={{ scale: 1 }}
              className="shrink-0 whitespace-nowrap font-semibold"
              style={{ color: V }}
            >
              {lvData}G · XFS
            </motion.span>
          </p>
          <div className="progress-track mt-3 h-2">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${(usedInData / lvData) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{ background: `linear-gradient(90deg, ${V}, ${V}aa)` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-faint">
            app dataset · {usedInData}G used · grow-only
          </p>
        </button>
        <button
          onClick={() => pickSeg("logs")}
          className="rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors duration-150 hover:border-terracotta/40 md:p-5"
        >
          <p className="flex items-center justify-between gap-2 font-mono text-[13.5px] text-foreground">
            <span className="flex min-w-0 items-center gap-2">
              <Database className="h-4 w-4 shrink-0" style={{ color: V }} />
              <span className="truncate">/dev/vg_lab/lv_logs</span>
            </span>
            <span className="shrink-0 whitespace-nowrap" style={{ color: V }}>
              {logsSize}G · ext4
            </span>
          </p>
          <div className="progress-track mt-3 h-2">
            <div className="h-full w-[46%] rounded-full" style={{ background: `${V}88` }} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-faint">
            write-heavy logs · can shrink
          </p>
        </button>
      </div>

      {/* snapshot visual */}
      <div className="relative min-h-[30px]">
        <AnimatePresence>
          {(snapshot === "taken" || snapshot === "merging") && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-[11.5px]"
              style={{ borderColor: `${V}55`, background: "var(--card)", color: "var(--foreground)" }}
            >
              <Camera className="h-4 w-4" style={{ color: V }} />
              lv_data_snap · 1G COW
              {snapshot === "merging" && <Undo2 className="h-4 w-4 animate-pulse" style={{ color: V }} />}
            </motion.div>
          )}
        </AnimatePresence>
        {snapshot === "none" && (
          <p className="font-mono text-[11px] text-text-faint">
            tip: snapshot before every risky deploy — merge rolls back byte-identical
          </p>
        )}
      </div>

      {/* inspector — what you just clicked */}
      <div
        aria-live="polite"
        className="rounded-xl border px-4 py-3.5 md:px-5"
        style={{
          borderColor: `${V}44`,
          background: `${V}0a`,
        }}
      >
        <p className="font-mono text-[13px] font-semibold" style={{ color: V }}>
          {sel?.title}
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{sel?.detail}</p>
        {sel?.cmd && (
          <p className="mt-2 font-mono text-[11.5px] text-muted-foreground">
            try: <span className="text-foreground">{sel.cmd}</span>
          </p>
        )}
      </div>

      {/* command + actions */}
      <div className="term-panel rounded-xl px-4 py-3 font-mono text-[13px]" aria-live="polite">
        <span style={{ color: V }}>$ </span>
        <span className="text-term-text">{cmd}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={extend}
          disabled={extended || extending}
          className="btn-secondary !px-4 !py-2.5 !text-[13px] font-mono disabled:opacity-45"
          style={extended ? { color: "var(--sage)", borderColor: "rgba(120,140,93,0.4)" } : undefined}
        >
          {extended ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {extended ? "extended — 5G → 7G online" : extending ? "extending…" : "add a 4G disk & extend"}
        </button>
        <button
          onClick={takeSnapshot}
          disabled={snapshot !== "none"}
          className="btn-secondary !px-4 !py-2.5 font-mono !text-[13px] disabled:opacity-45"
        >
          <Camera className="h-4 w-4" />
          {snapshot === "taking" && "snapshotting…"}
          {snapshot === "taken" && "snapshot live — corrupting…"}
          {snapshot === "merging" && "merging back…"}
          {snapshot === "none" && "snapshot → merge (rollback)"}
        </button>
      </div>
    </div>
  );
}
