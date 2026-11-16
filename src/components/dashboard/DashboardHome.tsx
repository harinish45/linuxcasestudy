"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  HardDrive,
  Network,
  Container,
  Target,
  TerminalSquare,
  Sparkles,
  ArrowRight,
  Eye,
  NotebookPen,
  Youtube,
  CheckCircle2,
  PlayCircle,
  Workflow,
  Compass,
  RotateCcw,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import Counter from "@/components/Counter";
import { TOPICS, CHALLENGES } from "@/data/learning";
import { ROUTES, topicRoute, useLabStore, useProgressStore } from "@/lib/store";

const HEADLINE = "Master the Linux stack, one lab at a time.";
const TOPIC_ICONS = { harddrive: HardDrive, network: Network, container: Container } as const;

function TypedHeadline() {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? HEADLINE.length : 0);
  const done = n >= HEADLINE.length;

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= HEADLINE.length) window.clearInterval(t);
    }, 42);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-[#e8eefc] sm:text-5xl md:text-[54px] md:leading-[1.1]">
      {HEADLINE.slice(0, n)}
      {!done && <span className="caret-green" aria-hidden />}
    </h1>
  );
}

export default function DashboardHome() {
  const replayIntro = useLabStore((s) => s.replayIntro);
  const completed = useProgressStore((s) => s.completed);
  const lastCourse = useProgressStore((s) => s.lastCourse);
  const videoCount = TOPICS.reduce((a, t) => a + t.videos.length, 0);
  const cmdCount = TOPICS.reduce((a, t) => a + t.cheatsheet.length, 0);

  const continueHref = lastCourse ?? ROUTES.lvm;
  const continueTopic = TOPICS.find((t) => topicRoute(t.key) === continueHref) ?? TOPICS[0];

  return (
    <div className="flex flex-col gap-14 md:gap-16">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section aria-label="Welcome">
        <Reveal y={10}>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4ade8040] bg-[#4ade800d] px-4 py-1.5 font-mono text-[11px] tracking-wide text-[#4ade80]">
            <Sparkles className="h-3.5 w-3.5" />
            learn by doing — visuals · notes · videos · challenges
          </p>
        </Reveal>

        <TypedHeadline />

        <Reveal delay={0.12} y={14}>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#8fa2c9] md:text-lg">
            Three skills that separate users from operators —{" "}
            <span className="text-[#e8eefc]">LVM storage</span>,{" "}
            <span className="text-[#e8eefc]">NFS sharing</span> and{" "}
            <span className="text-[#e8eefc]">containers</span> — taught with animated diagrams you can poke,
            cheat-sheets you can copy, verified video lessons and an arena that grades you like LeetCode.
          </p>
        </Reveal>

        <Reveal delay={0.2} y={14}>
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <Link
              href={continueHref}
              className="group inline-flex items-center gap-2 rounded-xl border border-[#4ade8066] bg-[#4ade8014] px-5 py-2.5 text-sm font-medium text-[#4ade80] transition-all duration-300 hover:bg-[#4ade8026] hover:shadow-[0_0_28px_rgba(74,222,128,0.25)]"
            >
              <PlayCircle className="h-4 w-4" />
              {completed.length > 0 ? `continue · ${continueTopic.name}` : "start learning"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={ROUTES.practice}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#e8eefc] transition-all duration-300 hover:border-white/25 hover:bg-white/10"
            >
              <Target className="h-4 w-4 text-[#fbbf24]" />
              challenge arena
            </Link>
            <button
              onClick={replayIntro}
              aria-label="Replay the hacker boot intro"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:border-[#4ade8066] hover:text-[#4ade80]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              replay intro
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Learning path ────────────────────────────────────── */}
      <section aria-labelledby="path-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#8fa2c9]">learning path</p>
            <h2 id="path-heading" className="mt-1.5 text-2xl font-semibold tracking-tight text-[#e8eefc]">
              Three chapters, one stack
            </h2>
          </div>
          <p className="hidden font-mono text-[11px] text-[#64748b] sm:block">
            {completed.length}/3 complete
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TOPICS.map((t, i) => {
            const Icon = TOPIC_ICONS[t.icon];
            const done = completed.includes(t.key);
            return (
              <Reveal key={t.key} delay={0.06 * i}>
                <Link
                  href={topicRoute(t.key)}
                  aria-label={`Open the ${t.name} course`}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/6"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(240px circle at 50% 0%, rgba(${t.rgb},0.16), transparent 70%)` }}
                  />
                  <div className="relative flex items-start justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${t.accentHex}44`, background: `${t.accentHex}12`, color: t.accentHex }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {done ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-[#34d39955] bg-[#34d39912] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-widest text-[#34d399]">
                        <CheckCircle2 className="h-3 w-3" />
                        done
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] tracking-[0.3em] text-[#64748b]">{t.num}</span>
                    )}
                  </div>
                  <p className="relative mt-4 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: t.accentHex }}>
                    chapter {t.num} — {t.name}
                  </p>
                  <p className="relative mt-1.5 text-[16px] font-semibold text-[#e8eefc]">{t.title}</p>
                  <p className="relative mt-1.5 min-h-[36px] text-[12.5px] leading-relaxed text-[#8fa2c9]">{t.tagline}</p>
                  <p className="relative mt-4 flex items-center justify-between border-t border-white/8 pt-3.5 font-mono text-[11px] text-[#8fa2c9]">
                    <span>
                      {t.lesson.length} lessons · {t.cheatsheet.length} cmds · {t.videos.length} videos
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" style={{ color: t.accentHex }} />
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── How the lab works ───────────────────────────────── */}
      <section aria-labelledby="how-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#8fa2c9]">how the lab works</p>
        <h2 id="how-heading" className="mt-1.5 text-2xl font-semibold tracking-tight text-[#e8eefc]">
          Every chapter runs the same loop
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Eye className="h-4.5 w-4.5" />, hex: "#7c5cff", title: "See it", body: "Interactive diagrams — drag, click and scrub the real mechanics." },
            { icon: <NotebookPen className="h-4.5 w-4.5" />, hex: "#22d3ee", title: "Note it", body: "Concept cards + a copy-ready cheat sheet for every command." },
            { icon: <Youtube className="h-4.5 w-4.5" />, hex: "#f472b6", title: "Watch it", body: "Hand-picked YouTube lessons, links verified before shipping." },
            { icon: <Target className="h-4.5 w-4.5" />, hex: "#34d399", title: "Prove it", body: "Arena challenges grade your commands like LeetCode." },
          ].map((s, i) => (
            <Reveal key={s.title} delay={0.06 * i}>
              <div className="h-full rounded-2xl border border-white/8 bg-white/4 p-5">
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${s.hex}44`, background: `${s.hex}12`, color: s.hex }}
                  >
                    {s.icon}
                  </span>
                  <span className="font-mono text-[10px] text-[#64748b]">step {i + 1}</span>
                </div>
                <p className="mt-3.5 text-[14.5px] font-semibold text-[#e8eefc]">{s.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8fa2c9]">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Quick links ─────────────────────────────────────── */}
      <section aria-label="Quick links" className="grid gap-4 md:grid-cols-3">
        {[
          { href: ROUTES.pipeline, icon: <Workflow className="h-4 w-4" />, hex: "#7c5cff", title: "Integration pipeline", body: "Grow one volume and watch storage → NFS → containers react live." },
          { href: ROUTES.terminal, icon: <TerminalSquare className="h-4 w-4" />, hex: "#34d399", title: "Terminal lab", body: "Scripted scenarios type themselves — then copy or download the .sh." },
          { href: ROUTES.resources, icon: <Compass className="h-4 w-4" />, hex: "#fbbf24", title: "More places to practise", body: "OverTheWire, Killercoda, KodeKloud and more — all verified." },
        ].map((q, i) => (
          <Reveal key={q.href} delay={0.06 * i}>
            <Link
              href={q.href}
              className="group flex h-full items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4 transition-all duration-300 hover:border-white/25 hover:bg-white/6"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{ borderColor: `${q.hex}44`, background: `${q.hex}12`, color: q.hex }}
              >
                {q.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-[#e8eefc]">{q.title}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[#8fa2c9]">{q.body}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#64748b] transition-all group-hover:translate-x-1 group-hover:text-white" />
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <Reveal>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-4">
          {[
            { v: 3, suffix: "", label: "deep chapters" },
            { v: cmdCount, suffix: "+", label: "copy-ready commands" },
            { v: videoCount, suffix: "", label: "verified video lessons" },
            { v: CHALLENGES.length, suffix: "", label: "arena challenges" },
          ].map((s) => (
            <div key={s.label} className="bg-[#070a14] px-6 py-5 text-center">
              <p className="font-mono text-2xl font-semibold text-[#e8eefc] md:text-3xl">
                <Counter value={s.v} suffix={s.suffix} />
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8fa2c9]">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
