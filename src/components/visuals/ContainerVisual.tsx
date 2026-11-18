"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Play, Pause, Square, Trash2, Box, HardDrive, Hammer, Check } from "lucide-react";

const V = "#788c5d";
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const LAYERS: { id: string; label: string; size: string; why: string }[] = [
  { id: "base", label: "FROM ubuntu:24.04", size: "78MB", why: "The base image — shared with every container that starts from it." },
  { id: "apt", label: "RUN apt-get install deps", size: "24MB", why: "One RUN = one layer. apt layer rarely changes, so it stays cached." },
  { id: "node", label: "COPY node_modules", size: "12MB", why: "Dependencies before source code — they change less often, cache survives." },
  { id: "src", label: "COPY src/ ./src", size: "0.4MB", why: "Your code last — the layer that rebuilds on every edit." },
  { id: "cmd", label: "ENTRYPOINT [\"./app\"]", size: "0B meta", why: "Pure metadata — the launch command. No filesystem cost at all." },
];

type State = "idle" | "building" | "created" | "running" | "paused" | "stopped";

/**
 * Containers interactive diagram — image layers stack on build,
 * then a container runs through its lifecycle. Volume persists.
 * Click any layer to learn what it does.
 */
export default function ContainerVisual() {
  const reduced = useReducedMotion();
  const [state, setState] = useState<State>("idle");
  const [builtLayers, setBuiltLayers] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [volumeExists, setVolumeExists] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [sel, setSel] = useState<string | null>("cmd");
  const token = useRef(0);

  const running = state === "running" || state === "paused";

  useEffect(() => () => { token.current++; }, []);

  useEffect(() => {
    if (state !== "running") return;
    const t = window.setInterval(() => setUptime((u) => u + 1), 1000);
    return () => window.clearInterval(t);
  }, [state]);

  const build = async () => {
    if (state !== "idle" && state !== "stopped") return;
    const my = ++token.current;
    setState("building");
    for (let i = 0; i < LAYERS.length; i++) {
      if (token.current !== my) return;
      await sleep(reduced ? 60 : 420);
      if (token.current !== my) return;
      setBuiltLayers(i + 1);
    }
    await sleep(300);
    if (token.current !== my) return;
    setState("created");
  };

  const start = () => {
    if (state !== "created") return;
    setRemoved(false);
    setUptime(0);
    setState("running");
  };

  const rm = () => {
    if (state !== "stopped" && state !== "created" && state !== "paused") return;
    token.current += 1;
    setState("idle");
    setBuiltLayers(0);
    setUptime(0);
    setRemoved(true); // volume stays — that's the lesson
    setVolumeExists(true);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const STATE_META: Record<State, { label: string; color: string }> = {
    idle: { label: "no container", color: "var(--text-faint)" },
    building: { label: "building…", color: "#c6613f" },
    created: { label: "created", color: "var(--muted-foreground)" },
    running: { label: "running", color: V },
    paused: { label: "paused", color: "#c6613f" },
    stopped: { label: "stopped", color: "var(--muted-foreground)" },
  };

  const selected = LAYERS.find((l) => l.id === sel);

  return (
    <div className="flex flex-col gap-6">
      {/* image layer stack */}
      <div>
        <p className="kicker mb-3 flex items-center gap-2 text-[12px]">
          <Hammer className="h-4 w-4" style={{ color: V }} /> image — lab-app:1.0 · read-only layers
        </p>
        <div className="flex flex-col gap-2">
          {LAYERS.map((l, i) => (
            <motion.button
              key={l.id}
              initial={false}
              animate={
                i < builtLayers
                  ? { opacity: 1, x: 0, scale: 1 }
                  : { opacity: 0.35, x: -10, scale: 0.99 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={() => setSel(l.id)}
              aria-pressed={sel === l.id}
              aria-label={`Layer: ${l.label}`}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 font-mono text-[13px] transition-colors duration-150 ${
                sel === l.id ? "ring-1" : ""
              }`}
              style={{
                borderColor: i < builtLayers ? `${V}55` : "var(--border)",
                background: i < builtLayers ? `${V}12` : "var(--secondary)",
                color: i < builtLayers ? "var(--foreground)" : "var(--text-faint)",
                ...(sel === l.id ? { outlineColor: `${V}66`, boxShadow: `inset 0 0 0 1px ${V}44` } : {}),
              }}
            >
              <span className="flex items-center gap-2.5">
                {i < builtLayers && <Check className="h-3.5 w-3.5" style={{ color: V }} />}
                {l.label}
              </span>
              <span className="text-[10.5px] text-muted-foreground">{l.size}</span>
            </motion.button>
          ))}
          {/* writable layer — appears once container runs */}
          <AnimatePresence>
            {running && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between rounded-xl border border-dashed px-4 py-3 font-mono text-[13px]"
                style={{ borderColor: `${V}88`, background: `${V}0d`, color: "var(--foreground)" }}
              >
                <span className="flex items-center gap-2.5">
                  <Box className="h-3.5 w-3.5" style={{ color: V }} /> writable layer — container web
                </span>
                <span className="text-[10.5px]" style={{ color: V }}>
                  {fmt(uptime)} {state === "paused" ? "(frozen)" : "live"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* lifecycle control bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={build}
          disabled={state === "building" || state === "created" || running}
          className="btn-secondary !px-4 !py-2.5 font-mono !text-[13px] disabled:opacity-45"
        >
          <Hammer className="h-4 w-4" />
          {state === "building" ? "building…" : builtLayers ? "rebuild image" : "docker build"}
        </button>
        <button
          onClick={start}
          disabled={state !== "created"}
          className="btn-secondary !px-4 !py-2.5 font-mono !text-[13px] disabled:opacity-45"
        >
          <Play className="h-4 w-4" /> docker run -d
        </button>
        <button
          onClick={() => setState((s) => (s === "running" ? "paused" : s === "paused" ? "running" : s))}
          disabled={!running}
          className="btn-secondary !px-4 !py-2.5 font-mono !text-[13px] disabled:opacity-45"
        >
          {state === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {state === "paused" ? "unpause" : "pause"}
        </button>
        <button
          onClick={() => setState(running || state === "created" ? "stopped" : state)}
          disabled={!running && state !== "created"}
          className="btn-secondary !px-4 !py-2.5 font-mono !text-[13px] disabled:opacity-45"
        >
          <Square className="h-4 w-4" /> stop
        </button>
        <button
          onClick={rm}
          disabled={!running && state !== "created" && state !== "stopped"}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 font-mono text-[13px] text-destructive transition-colors duration-150 hover:border-destructive/60 disabled:opacity-45"
        >
          <Trash2 className="h-4 w-4" /> rm -f
        </button>
      </div>

      {/* status strip */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <span className="flex items-center gap-2.5 font-mono text-[13px]">
          <span
            className="led h-2 w-2 rounded-full"
            style={{
              background: STATE_META[state].color,
              animationDuration: running ? "1.6s" : "3s",
            }}
          />
          <span className="text-foreground">web</span>
          <span style={{ color: STATE_META[state].color }}>— {STATE_META[state].label}</span>
        </span>
        <AnimatePresence>
          {removed && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[11px]"
              style={{ color: V }}
            >
              container gone — volume survived
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* volume persistence */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[13px] text-foreground">
          <HardDrive className="h-4 w-4 shrink-0" style={{ color: V }} />
          <span className="whitespace-nowrap">docker volume — lab_data</span>
          <span className="hidden text-[10.5px] text-text-faint sm:inline">/var/lib/docker/volumes</span>
        </span>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10.5px] whitespace-nowrap"
          style={{ color: V, background: `${V}14` }}
        >
          persists ∅ docker rm
        </span>
      </div>

      {/* selected layer explainer */}
      {selected && (
        <div
          className="rounded-xl border px-4 py-3.5 md:px-5"
          style={{ borderColor: `${V}44`, background: `${V}0a` }}
          aria-live="polite"
        >
          <p className="font-mono text-[13px] font-semibold" style={{ color: V }}>
            {selected.label}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{selected.why}</p>
        </div>
      )}

      {/* command echo */}
      <div className="term-panel rounded-xl px-4 py-3 font-mono text-[13px]" aria-live="polite">
        <span style={{ color: V }}>$ </span>
        <span className="text-term-text">
          {state === "idle" && "docker build -t lab-app:1.0 ."}
          {state === "building" && "Step 3/5 — RUN apt-get install deps"}
          {state === "created" && "docker create — ready, waiting for start"}
          {state === "running" && "docker run -d --name web -v lab_data:/data lab-app:1.0"}
          {state === "paused" && "docker pause web — process frozen (SIGSTOP)"}
          {state === "stopped" && "docker stop web — SIGTERM → SIGKILL after 10s"}
        </span>
      </div>
    </div>
  );
}
