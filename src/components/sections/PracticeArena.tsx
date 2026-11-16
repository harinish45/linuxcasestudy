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
import { CHALLENGES, type Challenge, type TopicKey } from "@/data/learning";
import { useToast } from "@/components/providers/ToastProvider";

const DIFF_COLORS: Record<string, string> = { easy: "#788c5d", medium: "#c6613f", hard: "#b3391b" };
const TOPIC_HEX: Record<TopicKey, string> = { lvm: "#d97757", nfs: "#6a9bcc", docker: "#788c5d" };
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
        <Reveal y={6}>
          <p className="kicker mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-terracotta" />
            practice arena — grade yourself
          </p>
        </Reveal>
        <Reveal delay={0.05} y={10}>
          <h1 id="practice-title" className="display text-[32px] leading-[1.15] text-foreground md:text-[40px]">
            LeetCode, but for the Linux terminal
          </h1>
        </Reveal>
        <Reveal delay={0.1} y={10}>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
            {CHALLENGES.length} challenges across LVM, NFS and containers — multiple-choice and real
            command tasks. Type the command, hit run, get graded instantly. Progress is saved in your
            browser.
          </p>
        </Reveal>

        {/* XP bar */}
        <Reveal delay={0.14} y={8}>
          <div className="surface mt-8 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-terracotta-soft text-terracotta-deep">
                <Trophy className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-foreground">
                  {progress.xp} <span className="text-[13px] font-normal text-muted-foreground">/ {totalXp} XP</span>
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
                  {solvedCount}/{CHALLENGES.length} solved
                </p>
              </div>
            </div>
            <div
              className="progress-track flex-1"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className="progress-fill progress-fill-sage"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
                style={{ height: "100%", borderRadius: 999 }}
              />
            </div>
            <button
              onClick={reset}
              className="btn-secondary shrink-0 !px-3.5 !py-2 font-mono !text-[11px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              reset
            </button>
          </div>
        </Reveal>

        {/* filters */}
        <Reveal delay={0.18} y={8}>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: `all ${CHALLENGES.length}` },
              { key: "lvm" as const, label: "lvm" },
              { key: "nfs" as const, label: "nfs" },
              { key: "docker" as const, label: "containers" },
              { key: "solved" as const, label: `solved ${solvedCount}` },
            ].map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3.5 py-1.5 font-mono text-[11.5px] transition-colors duration-150 ${
                    active
                      ? "border-terracotta/50 bg-terracotta-soft text-terracotta-deep"
                      : "border-border bg-card text-muted-foreground hover:border-input hover:text-foreground"
                  }`}
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
          <p className="mt-8 rounded-xl border border-dashed border-input px-6 py-10 text-center text-sm text-muted-foreground">
            Nothing here yet — solve some challenges first.
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
    <Reveal delay={Math.min(index * 0.03, 0.15)} y={8}>
      <motion.div
        layout
        className={`surface overflow-hidden transition-shadow duration-200 ${
          open ? "shadow-[0_3px_16px_rgba(20,20,19,0.07)]" : "surface-hover"
        }`}
      >
        {/* header row — always visible */}
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <span className="font-mono text-[11px] text-text-faint">{String(index + 1).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider"
                style={{ color: hex, background: `${hex}12` }}
              >
                {c.topic === "docker" ? "containers" : c.topic}
              </span>
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider"
                style={{ color: dColor, background: `${dColor}12` }}
              >
                {c.difficulty}
              </span>
              <span className="font-mono text-[9.5px] text-text-faint">{c.xp} xp</span>
            </span>
            <span className="mt-1.5 block truncate text-[14px] font-medium text-foreground">{c.title}</span>
          </span>
          {solved && <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-sage" />}
          {!solved && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
              {c.type === "quiz" ? "quiz" : "terminal"}
            </span>
          )}
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
        </button>

        {/* body */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
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
          className="btn-secondary !rounded-lg !px-3 !py-1.5 font-mono !text-[10.5px] hover:!text-[#c6613f]"
        >
          <Lightbulb className="h-3 w-3" />
          {show ? "hide hint" : "hint"}
        </button>
        <button
          onClick={() => setShowSol((s) => !s)}
          className="btn-secondary !rounded-lg !px-3 !py-1.5 font-mono !text-[10.5px] hover:!text-[#6a9bcc]"
        >
          <Eye className="h-3 w-3" />
          {showSol ? "hide explanation" : "explanation"}
        </button>
      </div>
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-infoblue/40 bg-infoblue-soft px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-text-secondary"
          >
            {c.hint}
          </motion.p>
        )}
        {showSol && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-border bg-secondary/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-text-secondary"
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
      <p className="text-[13.5px] leading-relaxed text-text-secondary">{c.prompt}</p>
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
              className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[13px] transition-colors duration-150 disabled:cursor-default"
              style={{
                borderColor:
                  state === "correct"
                    ? "rgba(120,140,93,0.5)"
                    : state === "wrong"
                      ? "rgba(179,57,27,0.4)"
                      : "var(--border)",
                background:
                  state === "correct"
                    ? "var(--sage-soft)"
                    : state === "wrong"
                      ? "rgba(179,57,27,0.06)"
                      : "var(--card)",
                color: state === "dim" ? "var(--text-faint)" : "var(--foreground)",
                opacity: state === "dim" ? 0.7 : 1,
              }}
            >
              {revealed && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-sage" />}
              {revealed && !isAnswer && picked === i && (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className="font-mono text-[10px] text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {revealed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 font-mono text-[11.5px]"
          style={{ color: correct ? "var(--sage)" : "var(--destructive)" }}
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
      <p className="text-[13.5px] leading-relaxed text-text-secondary">{c.prompt}</p>
      <div
        className={`term-panel flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-colors duration-150 ${
          result === "pass"
            ? "!border-sage/50"
            : result === "fail"
              ? "!border-destructive/50"
              : "focus-within:!border-terracotta"
        }`}
      >
        <span className="font-mono text-sm text-[#e08c6d]">$</span>
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
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-term-text outline-none placeholder:text-[#6e6a61]"
        />
        <button
          onClick={run}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#d97757] px-3.5 py-1.5 font-mono text-[11px] text-white transition-colors duration-150 hover:bg-[#c6613f]"
        >
          <Flame className="h-3 w-3" />
          run
        </button>
      </div>
      <AnimatePresence mode="wait">
        {result === "pass" && (
          <motion.p
            key="pass"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 font-mono text-[11.5px] text-sage"
          >
            <CheckCircle2 className="h-4 w-4" /> exit code 0 — correct.
          </motion.p>
        )}
        {result === "fail" && (
          <motion.p
            key="fail"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 font-mono text-[11.5px] text-destructive"
          >
            <XCircle className="h-4 w-4" /> exit code 1 — not the right command. hint?
          </motion.p>
        )}
      </AnimatePresence>
      <HintBar challenge={c} />
      {result === "fail" && (
        <p className="font-mono text-[10.5px] text-text-faint">
          tip: leading sudo is optional here — both forms count.
        </p>
      )}
    </div>
  );
}
