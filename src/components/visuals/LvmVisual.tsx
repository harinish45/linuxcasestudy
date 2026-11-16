"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HardDrive, Layers, Database, Camera, Undo2, Plus, Check } from "lucide-react";

const V = "#d97757";
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

interface Disk {
  id: string;
  size: number;
}

/**
 * LVM interactive diagram: disks → pool → slices.
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
    await sleep(1600);
    if (token.current !== my) return;
    setCmd("sudo lvs");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* PV row */}
      <div>
        <p className="kicker mb-2 flex items-center gap-2">
          <HardDrive className="h-3.5 w-3.5" style={{ color: V }} /> physical volumes — raw disks
        </p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {disks.map((d) => (
              <motion.div
                key={d.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2"
              >
                <span className="led h-1.5 w-1.5 rounded-full" style={{ background: V }} />
                <span className="font-mono text-xs text-foreground">/dev/{d.id}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{d.size}G</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* flow arrows */}
      <div className="flex items-center gap-2 px-6 text-muted-foreground" aria-hidden>
        <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="opacity-70">
          <path d="M9 0v18" stroke={V} strokeWidth="1.5" />
          <path d="M4 16l5 6 5-6" stroke={V} strokeWidth="1.5" fill="none" />
        </svg>
        <span className="font-mono text-[10px]">pvcreate · vgcreate · pooled extents</span>
      </div>

      {/* VG pool */}
      <div>
        <p className="kicker mb-2 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" style={{ color: V }} /> volume group — vg_lab ({vgTotal}G)
        </p>
        <div className="flex h-12 w-full overflow-hidden rounded-xl border border-border bg-secondary">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="h-full"
            style={{
              width: `${(lvData / vgTotal) * 100}%`,
              background: `linear-gradient(90deg, ${V}cc, ${V}99)`,
              borderRight: "1px dashed rgba(255,255,255,0.35)",
            }}
          />
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="h-full"
            style={{
              width: `${(logsSize / vgTotal) * 100}%`,
              background: `linear-gradient(90deg, ${V}66, ${V}44)`,
              borderRight: "1px dashed rgba(255,255,255,0.35)",
            }}
          />
          <div className="flex-1" style={{ background: "var(--surface-strong)" }} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-text-faint">
          <span>
            lv_data {lvData}G · lv_logs {logsSize}G · free {Math.max(vgTotal - lvData - logsSize, 0)}G
          </span>
          <span>4 MiB extents</span>
        </div>
      </div>

      {/* LV row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
          <p className="flex items-center justify-between gap-2 font-mono text-xs text-foreground">
            <span className="flex min-w-0 items-center gap-2">
              <Database className="h-3.5 w-3.5 shrink-0" style={{ color: V }} />
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
          <div className="progress-track mt-2.5">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${(usedInData / lvData) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{ background: `linear-gradient(90deg, ${V}, ${V}aa)` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-text-faint">
            app dataset · {usedInData}G used · grow-only
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
          <p className="flex items-center justify-between gap-2 font-mono text-xs text-foreground">
            <span className="flex min-w-0 items-center gap-2">
              <Database className="h-3.5 w-3.5 shrink-0" style={{ color: V }} />
              <span className="truncate">/dev/vg_lab/lv_logs</span>
            </span>
            <span className="shrink-0 whitespace-nowrap" style={{ color: V }}>
              {logsSize}G · ext4
            </span>
          </p>
          <div className="progress-track mt-2.5">
            <div className="h-full w-[46%] rounded-full" style={{ background: `${V}88` }} />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-text-faint">
            write-heavy logs · can shrink
          </p>
        </div>
      </div>

      {/* snapshot visual */}
      <div className="relative min-h-[26px]">
        <AnimatePresence>
          {(snapshot === "taken" || snapshot === "merging") && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[10.5px]"
              style={{ borderColor: `${V}55`, background: "var(--card)", color: "var(--foreground)" }}
            >
              <Camera className="h-3.5 w-3.5" style={{ color: V }} />
              lv_data_snap · 1G COW
              {snapshot === "merging" && <Undo2 className="h-3.5 w-3.5 animate-pulse" style={{ color: V }} />}
            </motion.div>
          )}
        </AnimatePresence>
        {snapshot === "none" && (
          <p className="font-mono text-[10px] text-text-faint">
            tip: snapshot before every risky deploy — merge rolls back byte-identical
          </p>
        )}
      </div>

      {/* command + actions */}
      <div className="term-panel rounded-lg px-3.5 py-2.5 font-mono text-[12px]" aria-live="polite">
        <span style={{ color: V }}>$ </span>
        <span className="text-term-text">{cmd}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={extend}
          disabled={extended || extending}
          className="btn-secondary !text-xs font-mono disabled:opacity-45"
          style={extended ? { color: "var(--sage)", borderColor: "rgba(120,140,93,0.4)" } : undefined}
        >
          {extended ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {extended ? "extended — 5G → 7G online" : extending ? "extending…" : "add a 4G disk & extend"}
        </button>
        <button
          onClick={takeSnapshot}
          disabled={snapshot !== "none"}
          className="btn-secondary font-mono !text-xs disabled:opacity-45"
        >
          <Camera className="h-3.5 w-3.5" />
          {snapshot === "taking" && "snapshotting…"}
          {snapshot === "taken" && "snapshot live — corrupting…"}
          {snapshot === "merging" && "merging back…"}
          {snapshot === "none" && "snapshot → merge (rollback)"}
        </button>
      </div>
    </div>
  );
}
