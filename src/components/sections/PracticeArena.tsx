"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  RotateCcw,
  ChevronRight,
  Flame,
  Trophy,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { CHALLENGES, TOPICS, type Challenge, type TopicKey } from "@/data/learning";
import { useToast } from "@/components/providers/ToastProvider";

const DIFF_COLORS: Record<string, string> = { easy: "#34d399", medium: "#fbbf24", hard: "#f87171" };
const TOPIC_HEX: Record<TopicKey, string> = { lvm: "#7c5cff", nfs: "#22d3ee", docker: "#34d399" };
const STORE_KEY = "clu-arena-v1";

interface Progress {
  solved: string[];
  xp: number;
}

/* localStorage progress as an external store — SSR-safe, no setState-in-effect. */
const EMPTY: Progress = { solved: [], xp: 0 };
let progressCache: Progress | null = null;
const progressListeners = new Set<() => void>();

function readProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const p = raw ? (JSON.parse(raw) as Progress) : EMPTY;
    progressCache = p;
    return p;
  } catch {
    return EMPTY;
  }
}

function writeProgress(p: Progress) {
  progressCache = p;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch {
    /* private mode — memory only */
  }
  progressListeners.forEach((l) => l());
}

function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      const wrapped = () => {
        progressCache = null; // external change → invalidate cache
        cb();
      };
      progressListeners.add(wrapped);
      window.addEventListener("storage", wrapped);
      return () => {
        progressListeners.delete(wrapped);
        window.removeEventListener("storage", wrapped);
      };
    },
    () => progressCache ?? readProgress(),
    () => EMPTY
  );
}

const normalizeCmd = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/^sudo\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/["']/g, "");

/** LeetCode-style practice arena: quiz + terminal challenges, XP, saved progress. */
export default function PracticeArena() {
  const { push } = useToast();
  const [filter, setFilter] = useState<"all" | TopicKey | "solved">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const progress = useProgress();

  const solve = (c: Challenge) => {
    if (progress.solved.includes(c.id)) return;
    writeProgress({ solved: [...progress.solved, c.id], xp: progress.xp + c.xp });
    push({ title: `+${c.xp} XP — challenge solved`, description: c.title, tone: "success" });
  };

  const reset = () => {
    writeProgress({ solved: [], xp: 0 });
    push({ title: "Progress reset", description: "Arena wiped — go earn it back.", tone: "info" });
  };

  const list = useMemo(() => {
    if (filter === "all") return CHALLENGES;
    if (filter === "solved") return CHALLENGES.filter((c) => progress.solved.includes(c.id));
    return CHALLENGES.filter((c) => c.topic === filter);
  }, [filter, progress.solved]);

  const totalXp = CHALLENGES.reduce((a, c) => a + c.xp, 0);
  const pct = Math.round((progress.xp / totalXp) * 100);
  const solvedCount = progress.solved.length;

  return (
    <section id="practice" className="relative" aria-labelledby="practice-title">
      <div>
        <Reveal>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[#4ade80]">
            <Target className="h-4 w-4" />
            practice arena — grade yourself
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 id="practice-title" className="text-3xl font-semibold tracking-tight text-[#e8eefc] md:text-4xl">
            LeetCode, but for the Linux terminal
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8fa2c9] md:text-lg">
            {CHALLENGES.length} challenges across LVM, NFS and containers — multiple-choice and real command tasks.
            Type the command, hit run, get graded instantly. Progress is saved in your browser.
          </p>
        </Reveal>

        {/* XP bar */}
        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#4ade8044] bg-[#4ade8012]">
                <Trophy className="h-5 w-5 text-[#4ade80]" />
              </span>
              <div>
                <p className="font-mono text-lg font-semibold text-[#e8eefc]">
                  {progress.xp} <span className="text-sm text-[#8fa2c9]">/ {totalXp} XP</span>
                </p>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#8fa2c9]">
                  {solvedCount}/{CHALLENGES.length} solved
                </p>
              </div>
            </div>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
                style={{ background: "linear-gradient(90deg, #4ade80, #a3e635)", boxShadow: "0 0 14px rgba(74,222,128,0.5)" }}
              />
            </div>
            <button
              onClick={reset}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/12 px-3.5 py-2 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:border-red-400/40 hover:text-red-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              reset
            </button>
          </div>
        </Reveal>

        {/* filters */}
        <Reveal delay={0.22}>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: `all ${CHALLENGES.length}` },
              { key: "lvm" as const, label: "lvm" },
              { key: "nfs" as const, label: "nfs" },
              { key: "docker" as const, label: "containers" },
              { key: "solved" as const, label: `solved ${solvedCount}` },
            ].map((f) => {
              const active = filter === f.key;
              const color = f.key === "all" || f.key === "solved" ? "#4ade80" : TOPIC_HEX[f.key as TopicKey];
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className="rounded-lg border px-4 py-2 font-mono text-[11.5px] transition-all duration-300"
                  style={{
                    borderColor: active ? `${color}66` : "rgba(255,255,255,0.12)",
                    background: active ? `${color}14` : "transparent",
                    color: active ? "#e8eefc" : "#8fa2c9",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* challenge list */}
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {list.map((c, i) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              index={i}
              solved={progress.solved.includes(c.id)}
              open={openId === c.id}
              onToggle={() => setOpenId((id) => (id === c.id ? null : c.id))}
              onSolve={() => solve(c)}
            />
          ))}
        </div>
        {list.length === 0 && (
          <p className="mt-8 rounded-2xl border border-dashed border-white/12 px-6 py-10 text-center font-mono text-sm text-[#8fa2c9]">
            nothing here yet — solve some challenges first.
          </p>
        )}
      </div>
    </section>
  );
}

function ChallengeCard({
  challenge: c,
  index,
  solved,
  open,
  onToggle,
  onSolve,
}: {
  challenge: Challenge;
  index: number;
  solved: boolean;
  open: boolean;
  onToggle: () => void;
  onSolve: () => void;
}) {
  const hex = TOPIC_HEX[c.topic];
  const dColor = DIFF_COLORS[c.difficulty];

  return (
    <Reveal delay={index * 0.04}>
      <motion.div
        layout
        className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
          open ? "border-white/25 bg-white/6" : "border-white/8 bg-white/3 hover:border-white/20"
        }`}
      >
        {/* header row — always visible */}
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <span className="font-mono text-[11px] text-[#64748b]">{String(index + 1).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider" style={{ borderColor: `${hex}55`, color: hex, background: `${hex}10` }}>
                {c.topic === "docker" ? "containers" : c.topic}
              </span>
              <span className="rounded-md border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider" style={{ borderColor: `${dColor}55`, color: dColor, background: `${dColor}10` }}>
                {c.difficulty}
              </span>
              <span className="font-mono text-[9.5px] text-[#8fa2c9]">{c.xp} xp</span>
            </span>
            <span className="mt-1.5 block truncate text-[14px] font-medium text-[#e8eefc]">{c.title}</span>
          </span>
          {solved && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#34d399]" />}
          {!solved && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">{c.type === "quiz" ? "quiz" : "terminal"}</span>
          )}
          <ChevronRight className={`h-4 w-4 shrink-0 text-[#8fa2c9] transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
        </button>

        {/* body */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-t border-white/8 px-4 pb-5 pt-4 sm:px-5">
                {c.type === "quiz" ? (
                  <QuizBody challenge={c} solved={solved} onSolve={onSolve} />
                ) : (
                  <CommandBody challenge={c} solved={solved} onSolve={onSolve} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reveal>
  );
}

function HintBar({ challenge: c }: { challenge: Challenge }) {
  const [show, setShow] = useState(false);
  const [showSol, setShowSol] = useState(false);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShow((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 font-mono text-[10.5px] text-[#8fa2c9] transition-colors hover:border-[#fbbf2466] hover:text-[#fbbf24]"
        >
          <Lightbulb className="h-3 w-3" />
          {show ? "hide hint" : "hint"}
        </button>
        <button
          onClick={() => setShowSol((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 font-mono text-[10.5px] text-[#8fa2c9] transition-colors hover:border-[#7c5cff66] hover:text-[#b3a0ff]"
        >
          <Eye className="h-3 w-3" />
          {showSol ? "hide explanation" : "explanation"}
        </button>
      </div>
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-[#fbbf2440] bg-[#fbbf240d] px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-[#fbbf24]"
          >
            {c.hint}
          </motion.p>
        )}
        {showSol && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-white/10 bg-white/4 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#b9c6e4]"
          >
            {c.explanation}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuizBody({ challenge: c, solved, onSolve }: { challenge: Challenge; solved: boolean; onSolve: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null || solved;
  const correct = solved || picked === c.answerIndex;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13.5px] leading-relaxed text-[#b9c6e4]">{c.prompt}</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={c.title}>
        {c.options?.map((opt, i) => {
          const isAnswer = i === c.answerIndex;
          const state = revealed ? (isAnswer ? "correct" : picked === i ? "wrong" : "dim") : "idle";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={picked === i}
              disabled={revealed}
              onClick={() => {
                setPicked(i);
                if (i === c.answerIndex) onSolve();
              }}
              className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[13px] transition-all duration-300 disabled:cursor-default"
              style={{
                borderColor:
                  state === "correct"
                    ? "#34d39966"
                    : state === "wrong"
                      ? "#f8717166"
                      : "rgba(255,255,255,0.12)",
                background:
                  state === "correct"
                    ? "#34d39912"
                    : state === "wrong"
                      ? "#f8717112"
                      : "rgba(255,255,255,0.03)",
                color: state === "dim" ? "#64748b" : "#e8eefc",
                opacity: state === "dim" ? 0.65 : 1,
              }}
            >
              {revealed && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34d399]" />}
              {revealed && !isAnswer && picked === i && <XCircle className="h-4 w-4 shrink-0 text-[#f87171]" />}
              <span className="font-mono text-[10px] text-[#8fa2c9]">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {revealed && (
        <motion.p
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 font-mono text-[11.5px]"
          style={{ color: correct ? "#34d399" : "#f87171" }}
        >
          {correct ? <Zap className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {correct ? "correct — nicely done." : "not quite — try the next one."}
        </motion.p>
      )}
      <HintBar challenge={c} />
    </div>
  );
}

function CommandBody({ challenge: c, solved, onSolve }: { challenge: Challenge; solved: boolean; onSolve: () => void }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"none" | "pass" | "fail">(solved ? "pass" : "none");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = () => {
    const norm = normalizeCmd(value);
    const ok = (c.accepted ?? []).some((a) => normalizeCmd(a) === norm);
    setResult(ok ? "pass" : "fail");
    if (ok) onSolve();
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13.5px] leading-relaxed text-[#b9c6e4]">{c.prompt}</p>
      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-[#05070f]/90 px-3.5 py-3 transition-colors duration-300 ${
          result === "pass" ? "border-[#34d39966]" : result === "fail" ? "border-[#f8717166]" : "border-white/12 focus-within:border-[#4ade8066]"
        }`}
      >
        <span className="font-mono text-sm text-[#4ade80]">$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResult("none");
          }}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="type the command…"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label={`Command input for: ${c.title}`}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#e8eefc] outline-none placeholder:text-[#64748b]"
        />
        <button
          onClick={run}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#4ade8055] bg-[#4ade8014] px-3.5 py-1.5 font-mono text-[11px] text-[#4ade80] transition-all duration-300 hover:bg-[#4ade8026]"
        >
          <Flame className="h-3 w-3" />
          run
        </button>
      </div>
      <AnimatePresence mode="wait">
        {result === "pass" && (
          <motion.p
            key="pass"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 font-mono text-[11.5px] text-[#34d399]"
          >
            <CheckCircle2 className="h-4 w-4" /> exit code 0 — correct.
          </motion.p>
        )}
        {result === "fail" && (
          <motion.p
            key="fail"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 font-mono text-[11.5px] text-[#f87171]"
          >
            <XCircle className="h-4 w-4" /> exit code 1 — not the right command. hint?
          </motion.p>
        )}
      </AnimatePresence>
      <HintBar challenge={c} />
      {result === "fail" && (
        <p className="font-mono text-[10.5px] text-[#64748b]">tip: leading sudo is optional here — both forms count.</p>
      )}
    </div>
  );
}
