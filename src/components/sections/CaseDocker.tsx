"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Layers, Play, Rocket, Skull } from "lucide-react";
import SceneShell from "@/components/three/SceneShell";
import { ContainerPoster } from "@/components/three/fallbacks";
import CaseContent from "@/components/CaseContent";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/providers/ToastProvider";
import {
  DOCKER_LAYERS,
  DOCKER_LIFECYCLE,
  type LifecycleState,
} from "@/data/docker";
import {
  DOCKER_META,
  DOCKER_STEPS,
  DOCKER_TROUBLESHOOTING,
  DOCKER_VERIFICATION,
} from "@/data/docker";
import type { LifecycleKey } from "@/components/three/ContainerScene";

const ContainerScene = dynamic(() => import("@/components/three/ContainerScene"), { ssr: false });

const EMERALD = "#34d399";

type CacheMode = "cold" | "cached" | "source-edit";

function layerState(mode: CacheMode, index: number): "hit" | "bust" | "miss" {
  if (mode === "cold") return "miss";
  if (mode === "cached") return "hit";
  return index <= 2 ? "hit" : "bust";
}

const STATE_STYLE: Record<"hit" | "bust" | "miss", { label: string; cls: string }> = {
  hit: { label: "cache hit", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  bust: { label: "cache bust", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  miss: { label: "miss", cls: "border-red-400/30 bg-red-400/10 text-red-300" },
};

function LayerVisualiser() {
  const [mode, setMode] = useState<CacheMode>("source-edit");
  const [selected, setSelected] = useState<number>(3);

  const modes: { key: CacheMode; label: string; note: string }[] = [
    { key: "cold", label: "Cold build", note: "First build on a fresh runner — every layer downloads/installs. 41.2s." },
    { key: "cached", label: "No changes", note: "Rebuild without edits — every layer is CACHED. 0.9s." },
    { key: "source-edit", label: "Source edit", note: "One file changed — layers under COPY src/ are reused, the tail rebuilds. 3.2s." },
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: EMERALD }}>
          <Layers className="h-3.5 w-3.5" /> image layer visualiser
        </p>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setSelected(m.key === "cached" ? 0 : 3);
              }}
              data-cursor="toggle"
              aria-pressed={mode === m.key}
              className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                mode === m.key
                  ? "border-[#34d39966] bg-[#34d39914] text-[#34d399]"
                  : "border-white/10 bg-white/5 text-[#8fa2c9] hover:text-[#e8eefc]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-col-reverse gap-1.5">
        {DOCKER_LAYERS.map((layer, i) => {
          const st = layerState(mode, i);
          const s = STATE_STYLE[st];
          const active = selected === i;
          return (
            <button
              key={i}
              onMouseEnter={() => setSelected(i)}
              onFocus={() => setSelected(i)}
              onClick={() => setSelected(i)}
              data-cursor="inspect"
              data-cursor-label="hover"
              aria-label={`Layer ${i + 1}: ${layer.instr} — ${s.label}`}
              className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-200 ${
                active ? "border-white/25 bg-white/8 translate-x-1" : "border-white/8 bg-white/3 hover:bg-white/6"
              }`}
              style={{ borderLeftWidth: 3, borderLeftColor: st === "hit" ? "#34d399" : st === "bust" ? "#f59e0b" : "#f87171" }}
            >
              <span className="w-5 shrink-0 font-mono text-[10px] text-[#8fa2c9]">{i + 1}</span>
              <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[#e8eefc]">{layer.instr}</code>
              <span className="shrink-0 font-mono text-[10.5px] text-[#8fa2c9]">{layer.size}</span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${s.cls}`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={mode + selected}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="rounded-lg border border-white/8 bg-[#05070f]/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#b9c6e4]"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: EMERALD }}>
            {DOCKER_LAYERS[selected].instr} ·{" "}
          </span>
          {DOCKER_LAYERS[selected].note}
        </motion.p>
      </AnimatePresence>
      <p className="mt-3 font-mono text-[10.5px] text-[#8fa2c9]">
        {modes.find((m) => m.key === mode)!.note}
      </p>
    </div>
  );
}

export default function CaseDocker() {
  const { push } = useToast();
  const [lifecycle, setLifecycle] = useState<LifecycleKey>("running");
  const [volumeMode, setVolumeMode] = useState<"idle" | "rm" | "run">("idle");
  const [volumeEvent, setVolumeEvent] = useState(0);

  const current: LifecycleState =
    DOCKER_LIFECYCLE.find((s) => s.key === lifecycle) ?? DOCKER_LIFECYCLE[1];

  const onLifecycle = (key: LifecycleKey) => {
    setLifecycle(key);
    if (key === "removed") {
      push({ title: "docker rm -f web", description: "Writable layer destroyed — check the volume demo below.", tone: "info" });
    }
  };

  const onRm = () => {
    setVolumeMode("rm");
    setVolumeEvent((n) => n + 1);
    push({ title: "Container destroyed", description: "The orb in lab_data didn't even blink.", tone: "success" });
  };

  const onRun = () => {
    setVolumeMode("run");
    push({ title: "docker run -v lab_data:/data", description: "New container, same data orb — sha256 identical.", tone: "success" });
  };

  return (
    <section id="containers" className="relative pt-10">
      <CaseContent
        meta={DOCKER_META}
        steps={DOCKER_STEPS}
        verification={DOCKER_VERIFICATION}
        troubleshooting={DOCKER_TROUBLESHOOTING}
        accentHex={EMERALD}
        extra={
          <div className="mb-14">
            {/* ── 3D stage ── */}
            <div className="glass relative mb-4 h-[460px] overflow-hidden rounded-2xl md:h-[560px]">
              <SceneShell
                label="Containers scene: a slow VM boot lane racing an instant container lane, lifecycle cube and volume demo"
                poster={<ContainerPoster />}
                render={(frameloop) => (
                  <ContainerScene
                    frameloop={frameloop}
                    lifecycle={lifecycle}
                    volumeMode={volumeMode}
                    volumeEvent={volumeEvent}
                    reduced={false}
                  />
                )}
              />
            </div>

            {/* lifecycle state machine */}
            <div className="glass-strong mb-4 rounded-2xl p-4">
              <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: EMERALD }}>
                <Boxes className="h-3.5 w-3.5" /> lifecycle state machine — click a state
              </p>
              <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Container lifecycle states">
                {DOCKER_LIFECYCLE.map((s) => (
                  <button
                    key={s.key}
                    role="tab"
                    aria-selected={lifecycle === s.key}
                    onClick={() => onLifecycle(s.key as LifecycleKey)}
                    data-cursor="run"
                    data-cursor-label="animate"
                    className={`rounded-lg border px-3.5 py-2 font-mono text-[12px] transition-all ${
                      lifecycle === s.key
                        ? "border-[#34d39966] bg-[#34d39916] text-[#34d399] shadow-[0_0_18px_rgba(52,211,153,0.25)]"
                        : "border-white/10 bg-white/5 text-[#8fa2c9] hover:text-[#e8eefc]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={lifecycle}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-white/10 bg-[#05070f]/80 p-4"
                >
                  <code className="block font-mono text-[12.5px] text-[#e8eefc]">
                    <span style={{ color: EMERALD }}>$ </span>
                    {current.command}
                  </code>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#8fa2c9]">{current.explain}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* volume persistence demo */}
            <div className="glass-strong mb-4 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: EMERALD }}>
                    volume persistence
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#b9c6e4]">
                    Containers are disposable. <span className="text-[#34d399]">Volumes are not.</span> Destroy the
                    cube — the orb in <code className="font-mono text-[#e8eefc]">lab_data</code> survives; run a new
                    cube and it forms around the same orb.
                  </p>
                </div>
                <div className="flex gap-2">
                  <MagneticButton onClick={onRm} accentHex={volumeMode === "rm" ? "#f87171" : undefined} cursorLabel="destroy" className="!px-4 !py-2.5 text-[12.5px]">
                    <Skull className="h-4 w-4 text-[#f87171]" />
                    docker rm -f
                  </MagneticButton>
                  <MagneticButton onClick={onRun} accentHex={volumeMode === "run" ? EMERALD : undefined} cursorLabel="run" className="!px-4 !py-2.5 text-[12.5px]">
                    <Play className="h-4 w-4 text-[#34d399]" />
                    docker run
                  </MagneticButton>
                </div>
              </div>
            </div>

            <LayerVisualiser />

            {/* race verdict chip */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#34d39933] bg-[#34d3990d] px-5 py-4 text-center">
              <Rocket className="h-4 w-4 text-[#34d399]" />
              <p className="text-[13.5px] text-[#b9c6e4]">
                Same host, same app: <span className="font-mono text-[#e8eefc]">18s</span> to first VM request vs{" "}
                <span className="font-mono text-[#34d399]">0.2s</span> to first container request — a{" "}
                <span className="text-[#34d399]">90× head start</span> that compounds on every deploy.
              </p>
            </div>
          </div>
        }
      />
    </section>
  );
}
