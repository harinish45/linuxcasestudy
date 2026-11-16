"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Download, Play, Square, TerminalSquare, X } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/providers/ToastProvider";
import { copyText } from "@/lib/hooks";
import { LVM_SCENARIOS } from "@/data/lvm";
import { NFS_SCENARIOS } from "@/data/nfs";
import { DOCKER_SCENARIOS } from "@/data/docker";
import type { TermScenario } from "@/data/types";

type Tab = "lvm" | "nfs" | "docker";
interface Line {
  kind: "cmd" | "out" | "ok" | "fail";
  text: string;
}

const TABS: { key: Tab; label: string; accent: string; scenarios: TermScenario[] }[] = [
  { key: "lvm", label: "LVM", accent: "#d97757", scenarios: LVM_SCENARIOS },
  { key: "nfs", label: "NFS", accent: "#6a9bcc", scenarios: NFS_SCENARIOS },
  { key: "docker", label: "Docker", accent: "#788c5d", scenarios: DOCKER_SCENARIOS },
];

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function buildScript(s: TermScenario): string {
  const out: string[] = [
    "#!/usr/bin/env bash",
    "# Comprehensive Linux — Case Study Lab",
    `# scenario: ${s.title}`,
    `# ${s.blurb}`,
    "set -euo pipefail",
    "",
  ];
  for (const step of s.steps) {
    out.push(`# ${step.cmd}`);
    if (step.ok === false) {
      out.push(`${step.cmd} || echo "expected refusal (see case study)"`);
    } else {
      out.push(step.cmd);
    }
    out.push("");
  }
  return out.join("\n");
}

export default function TerminalLab() {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("lvm");
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const token = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTab = TABS.find((t) => t.key === tab)!;
  const scenario = activeTab.scenarios[Math.min(scenarioIdx, activeTab.scenarios.length - 1)];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const pickTab = (key: Tab) => {
    token.current += 1;
    setRunning(false);
    setTab(key);
    setScenarioIdx(0);
    setLines([]);
  };

  const run = async () => {
    const myToken = ++token.current;
    setRunning(true);
    setLines([]);
    const s = scenario;
    const work: Line[] = [];
    const sync = () => setLines(work.map((l) => ({ ...l })));

    work.push({ kind: "out", text: `# ${s.title} — ${s.blurb}` });
    sync();
    await sleep(350);

    for (const step of s.steps) {
      const cmdLine: Line = { kind: "cmd", text: "" };
      work.push(cmdLine);
      for (let i = 1; i <= step.cmd.length; i++) {
        if (token.current !== myToken) return;
        cmdLine.text = step.cmd.slice(0, i);
        sync();
        await sleep(35);
      }
      await sleep(180);
      for (const out of step.outputs) {
        if (token.current !== myToken) return;
        work.push({ kind: step.ok === false ? "fail" : "ok", text: out });
        sync();
        await sleep(120);
      }
      await sleep(260);
    }
    if (token.current !== myToken) return;
    work.push({ kind: "out", text: "# done — every check green ✓" });
    sync();
    setRunning(false);
  };

  const stop = () => {
    token.current += 1;
    setRunning(false);
    push({ title: "Run stopped", tone: "info" });
  };

  const copyAll = async () => {
    const text = buildScript(scenario);
    const ok = await copyText(text);
    push(
      ok
        ? { title: "Copied all commands", description: `${scenario.steps.length} steps on the clipboard.`, tone: "success" }
        : { title: "Copy failed", tone: "error" }
    );
  };

  const download = () => {
    const blob = new Blob([buildScript(scenario)], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-${scenario.id}.sh`;
    a.click();
    URL.revokeObjectURL(url);
    push({ title: "Downloaded", description: `lab-${scenario.id}.sh`, tone: "success" });
  };

  const totalScenarios = useMemo(() => TABS.reduce((n, t) => n + t.scenarios.length, 0), []);

  return (
    <section id="terminal" className="relative">
      <div>
        <SectionHeading
          kicker="Live terminal simulator"
          title="Run the lab yourself"
          description={`${totalScenarios} scripted scenarios across LVM, NFS and Docker — commands type themselves at 35ms/char, outputs stream at 120ms/line, and every verified line gets a green flag. Copy any scenario or download it as a .sh.`}
        />

        <Reveal y={8}>
          <div className="surface overflow-hidden">
            {/* tab bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => pickTab(t.key)}
                  aria-pressed={tab === t.key}
                  className={`rounded-lg border px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
                    tab === t.key
                      ? "bg-card text-foreground"
                      : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={
                    tab === t.key
                      ? { borderColor: `${t.accent}55`, color: t.accent, background: `${t.accent}0f` }
                      : undefined
                  }
                >
                  {t.label}
                  <span className="ml-2 text-[10px] opacity-60">{t.scenarios.length}</span>
                </button>
              ))}
              <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-text-faint md:inline">
                35ms/char · 120ms/line
              </span>
            </div>

            {/* scenario picker + controls */}
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-text-faint">
                  scenario
                </span>
                <select
                  value={scenarioIdx}
                  onChange={(e) => {
                    token.current += 1;
                    setRunning(false);
                    setScenarioIdx(Number(e.target.value));
                    setLines([]);
                  }}
                  className="input-field min-w-0 flex-1 !py-1.5 font-mono !text-[12px]"
                  aria-label="Choose scenario"
                >
                  {activeTab.scenarios.map((s, i) => (
                    <option key={s.id} value={i}>
                      {i + 1}. {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="hidden min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground xl:block">
                {scenario.blurb}
              </p>
              <div className="flex shrink-0 gap-2">
                <MagneticButton
                  onClick={run}
                  accentHex={activeTab.accent}
                  cursorLabel="run"
                  className="!px-4 !py-2 !text-[12px]"
                  ariaLabel="Run the selected scenario"
                >
                  <Play className="h-3.5 w-3.5" style={{ color: activeTab.accent }} />
                  Run
                </MagneticButton>
                {running && (
                  <MagneticButton
                    onClick={stop}
                    cursorLabel="stop"
                    className="!px-3 !py-2 !text-[12px]"
                    ariaLabel="Stop the current run"
                  >
                    <Square className="h-3.5 w-3.5 text-destructive" />
                  </MagneticButton>
                )}
                <MagneticButton
                  onClick={copyAll}
                  cursorLabel="copy"
                  className="!px-3 !py-2 !text-[12px]"
                  ariaLabel="Copy all commands"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </MagneticButton>
                <MagneticButton
                  onClick={download}
                  cursorLabel="save"
                  className="!px-3 !py-2 !text-[12px]"
                  ariaLabel="Download scenario as shell script"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  .sh
                </MagneticButton>
              </div>
            </div>

            {/* terminal body — stays dark, like a code block */}
            <div
              ref={scrollRef}
              aria-live="polite"
              aria-label="Terminal output"
              className="scanlines term-panel relative h-[400px] overflow-y-auto !rounded-none !border-x-0 !border-b-0 p-4 font-mono text-[12.5px] leading-relaxed md:h-[440px]"
            >
              {lines.length === 0 ? (
                <div className="text-[#8f8b80]">
                  <p className="flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4" style={{ color: activeTab.accent }} />
                    lab@z:~ — {scenario.id}
                  </p>
                  <p className="mt-2">
                    <span style={{ color: activeTab.accent }}>$</span> pick a scenario, press{" "}
                    <span className="text-[#edeae2]">Run</span>
                    <span className="term-cursor" />
                  </p>
                </div>
              ) : (
                <div>
                  {lines.map((l, i) => {
                    if (l.kind === "cmd") {
                      return (
                        <p key={i} className="text-[#edeae2]">
                          <span style={{ color: activeTab.accent }}>$ </span>
                          {l.text}
                          {i === lines.length - 1 && running && <span className="term-cursor" />}
                        </p>
                      );
                    }
                    if (l.kind === "out") {
                      return (
                        <p key={i} className="text-[#8f8b80]">
                          {l.text}
                        </p>
                      );
                    }
                    const okLine = l.kind === "ok";
                    return (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-2 border-l-2 pl-2.5 ${
                          okLine ? "border-[#788c5d] text-[#c3d1ab]" : "border-[#b3391b] text-[#e0a493]"
                        }`}
                      >
                        {okLine ? (
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#a7b98a]" />
                        ) : (
                          <X className="mt-0.5 h-3 w-3 shrink-0 text-[#e0705a]" />
                        )}
                        <span className="min-w-0 break-all">{l.text}</span>
                      </motion.p>
                    );
                  })}
                  {!running && (
                    <p className="mt-1 text-[#8f8b80]">
                      <span style={{ color: activeTab.accent }}>$</span>
                      <span className="term-cursor" />
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
