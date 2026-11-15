"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  Camera,
  Database,
  HardDrive,
  Layers3,
  Play,
  RotateCcw,
  ShieldOff,
  Trash2,
  Undo2,
} from "lucide-react";
import SceneShell from "@/components/three/SceneShell";
import { LvmPoster } from "@/components/three/fallbacks";
import CaseContent from "@/components/CaseContent";
import DemoPanel from "@/components/DemoPanel";
import MagneticButton from "@/components/MagneticButton";
import TweenNumber from "@/components/TweenNumber";
import { useToast } from "@/components/providers/ToastProvider";
import { LVM_META, LVM_PIPELINE_STEPS, LVM_STEPS, LVM_TROUBLESHOOTING, LVM_VERIFICATION } from "@/data/lvm";

const LvmScene = dynamic(() => import("@/components/three/LvmScene"), { ssr: false });

const VIOLET = "#7c5cff";
const SHA_ORIGINAL = "9f2c41a7d3e8b6f0";
const SHA_CORRUPT = "c41d8e2f6a9b3c7d";

const PHASES = [
  "① three raw disks drift in — pvcreate done",
  "② they magnetise into the vg_lab pool — vgcreate",
  "③ the pool splits: lv_data (XFS) + lv_logs (ext4)",
];

/** Checksum readout that visibly scrambles when its value changes. */
function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  const prev = useRef(text);
  useEffect(() => {
    if (prev.current === text) return;
    prev.current = text;
    let frame = 0;
    const total = 14;
    const iv = window.setInterval(() => {
      frame += 1;
      const settled = Math.floor((frame / total) * text.length);
      setDisplay(
        text
          .split("")
          .map((ch, i) => (i < settled ? ch : "0123456789abcdef"[Math.floor(Math.random() * 16)]))
          .join("")
      );
      if (frame >= total) {
        window.clearInterval(iv);
        setDisplay(text);
      }
    }, 40);
    return () => window.clearInterval(iv);
  }, [text]);
  return <span className="font-mono text-[12px] text-[#e8eefc]">sha256:{display}…</span>;
}

export default function CaseLVM() {
  const { push } = useToast();
  const reduced = useReducedMotion();

  // ── self-timed build sequence (no scroll hijack) ──
  const progressRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { margin: "-15% 0px -15% 0px" });
  const [phase, setPhase] = useState(0);
  const [playNonce, setPlayNonce] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / 3600);
      progressRef.current = t;
      const ph = t < 0.38 ? 0 : t < 0.72 ? 1 : 2;
      setPhase((prev) => (prev === ph ? prev : ph));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, playNonce]);

  const [extended, setExtended] = useState(false);
  const [snapshot, setSnapshot] = useState(false);
  const [corrupt, setCorrupt] = useState(false);
  const [rollbackCount, setRollbackCount] = useState(0);
  const [shaking, setShaking] = useState(false);

  const replay = useCallback(() => {
    startRef.current = null;
    progressRef.current = 0;
    setPhase(0);
    setExtended(false);
    setSnapshot(false);
    setCorrupt(false);
    setPlayNonce((n) => n + 1);
  }, []);

  const onExtend = () => {
    if (extended) {
      setExtended(false);
      push({ title: "Pool reset", description: "Back to 3 PVs — press replay to rebuild the sequence.", tone: "info" });
    } else {
      setExtended(true);
      push({ title: "lvextend -L +2G -r", description: "lv_data grown online — df: 5.0G → 7.0G, zero downtime.", tone: "success" });
    }
  };

  const onSnapshot = () => {
    if (snapshot) {
      setSnapshot(false);
      setCorrupt(false);
      push({ title: "Snapshot discarded", tone: "info" });
    } else {
      setSnapshot(true);
      push({ title: "lvcreate -s -n lv_data_snap -L 1G", description: "Point-in-time copy armed (copy-on-write).", tone: "success" });
    }
  };

  const onCorrupt = () => {
    if (corrupt || !snapshot) return;
    setCorrupt(true);
    push({ title: "Incident injected", description: "deploy.tar overwritten with random bytes — checksum changed.", tone: "error" });
  };

  const onRollback = () => {
    if (!corrupt) return;
    setRollbackCount((n) => n + 1);
    window.setTimeout(() => setCorrupt(false), 500);
    window.setTimeout(() => setSnapshot(false), 1000);
    push({ title: "lvconvert --merge", description: "Rolled back — sha256 matches the original again.", tone: "success" });
  };

  const onShrink = () => {
    setShaking(true);
    push({ title: "Refused: XFS is grow-only", description: "That's exactly why lv_logs is ext4.", tone: "error" });
  };

  return (
    <section id="lvm" className="relative">
      <CaseContent
        meta={LVM_META}
        steps={LVM_STEPS}
        verification={LVM_VERIFICATION}
        troubleshooting={LVM_TROUBLESHOOTING}
        accentHex={VIOLET}
        extra={
          <>
            {/* ── interactive stage ── */}
            <div ref={stageRef} className="mb-14">
              <motion.div animate={shaking ? { x: [0, -10, 10, -7, 7, 0] } : { x: 0 }} transition={{ duration: 0.45 }} onAnimationComplete={() => setShaking(false)}>
                <DemoPanel
                  title="interactive demo · pvcreate → vgcreate → lvcreate"
                  accentHex={VIOLET}
                  heightClass="h-[400px] md:h-[500px]"
                  badges={
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={phase}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-full border border-[#7c5cff44] bg-[#7c5cff14] px-3 py-1 font-mono text-[10.5px] text-[#c4b5fd]"
                      >
                        {PHASES[phase]}
                      </motion.span>
                    </AnimatePresence>
                  }
                  controls={
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <MagneticButton onClick={onExtend} accentHex={extended ? undefined : VIOLET} cursorLabel="toggle" className="!px-3.5 !py-2 text-[12px]">
                          <HardDrive className="h-3.5 w-3.5" style={{ color: VIOLET }} />
                          {extended ? "Reset pool" : "Extend +2G"}
                        </MagneticButton>
                        <MagneticButton onClick={onSnapshot} accentHex={snapshot ? "#34d399" : undefined} cursorLabel="toggle" className="!px-3.5 !py-2 text-[12px]">
                          <Camera className="h-3.5 w-3.5" style={{ color: snapshot ? "#34d399" : "#8fa2c9" }} />
                          {snapshot ? "Snapshot armed" : "Snapshot"}
                        </MagneticButton>
                        <MagneticButton
                          onClick={onCorrupt}
                          accentHex={corrupt ? "#f87171" : undefined}
                          cursorLabel="zap"
                          className={`!px-3.5 !py-2 text-[12px] ${!snapshot ? "pointer-events-none opacity-40" : ""}`}
                          ariaLabel="Corrupt the live data to test the snapshot"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#f87171]" />
                          Corrupt
                        </MagneticButton>
                        <MagneticButton
                          onClick={onRollback}
                          accentHex={corrupt ? "#34d399" : undefined}
                          cursorLabel="rewind"
                          className={`!px-3.5 !py-2 text-[12px] ${!corrupt ? "pointer-events-none opacity-40" : ""}`}
                          ariaLabel="Roll back to the snapshot"
                        >
                          <Undo2 className="h-3.5 w-3.5 text-[#34d399]" />
                          Rollback
                        </MagneticButton>
                        <MagneticButton onClick={onShrink} cursorLabel="denied" className="!px-3.5 !py-2 text-[12px]" ariaLabel="Attempt to shrink the XFS volume (will be refused)">
                          <ShieldOff className="h-3.5 w-3.5 text-[#f87171]" />
                          Shrink XFS
                        </MagneticButton>
                        <MagneticButton onClick={replay} cursorLabel="replay" className="!px-3.5 !py-2 text-[12px] sm:ml-auto" ariaLabel="Replay the build sequence">
                          <Play className="h-3.5 w-3.5 text-[#8fa2c9]" />
                          Replay build
                        </MagneticButton>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/8 pt-3 font-mono text-[12px]">
                        <span className="text-[#8fa2c9]">
                          df -h /mnt/lab/data
                          <span className="ml-2 text-[#e8eefc]">
                            <TweenNumber target={extended ? 7 : 5} decimals={1} suffix="G" />
                          </span>
                        </span>
                        <span className="text-[#8fa2c9]">
                          vg_lab VFree
                          <span className="ml-2 text-[#a78bfa]">
                            <TweenNumber target={extended ? 9 : 5} decimals={1} suffix="G" />
                          </span>
                        </span>
                        <span className="ml-auto">
                          <ScrambleText text={corrupt ? SHA_CORRUPT : SHA_ORIGINAL} />
                        </span>
                      </div>
                    </div>
                  }
                >
                  <SceneShell
                    label="LVM scene: disks stacking into a volume group, then splitting into two logical volumes"
                    poster={<LvmPoster />}
                    render={(frameloop) => (
                      <LvmScene
                        frameloop={frameloop}
                        progressRef={progressRef}
                        extended={extended}
                        snapshot={snapshot}
                        corrupt={corrupt}
                        rollbackCount={rollbackCount}
                        reduced={!!reduced}
                      />
                    )}
                  />
                </DemoPanel>
              </motion.div>
            </div>

            {/* ── PV → VG → LV pipeline cards ── */}
            <div className="mb-14 grid gap-4 md:grid-cols-3">
              {LVM_PIPELINE_STEPS.map((step, i) => {
                const Icon = step.key === "pv" ? HardDrive : step.key === "vg" ? Layers3 : Database;
                const active = phase >= i;
                return (
                  <div
                    key={step.key}
                    className={`glass rounded-2xl p-5 transition-all duration-500 ${
                      active ? "border-[#7c5cff66] shadow-[0_0_32px_rgba(124,92,255,0.18)]" : "opacity-70"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          active ? "bg-[#7c5cff26]" : "bg-white/5"
                        }`}
                      >
                        <Icon className="h-4 w-4" style={{ color: active ? VIOLET : "#8fa2c9" }} />
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: active ? VIOLET : "#8fa2c9" }}>
                        {step.label}
                      </span>
                      <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: active ? VIOLET : "rgba(143,162,201,0.3)", boxShadow: active ? `0 0 10px ${VIOLET}` : undefined }} />
                    </div>
                    <p className="text-[13.5px] font-medium text-[#e8eefc]">{step.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[#8fa2c9]">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </>
        }
      />
    </section>
  );
}
