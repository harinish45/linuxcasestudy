"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HardDrive, Network, Container, Target, TerminalSquare, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";
import MagneticButton from "@/components/MagneticButton";
import Counter from "@/components/Counter";
import { TOPICS, CHALLENGES, sectionIdOf } from "@/data/learning";
import { scrollToSection } from "@/lib/scroll";

const HEADLINE = "Learn Linux like a hacker.";

const TOPIC_ICONS = { harddrive: HardDrive, network: Network, container: Container } as const;

/** Typed headline with a green caret, then the rest of the hero reveals. */
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
    }, 55);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <h1 className="text-balance text-4xl font-semibold tracking-tight text-[#e8eefc] sm:text-5xl md:text-6xl lg:text-[68px] lg:leading-[1.08]">
      {HEADLINE.slice(0, n)}
      {!done && <span className="caret-green" aria-hidden />}
    </h1>
  );
}

export default function HeroLearn() {
  const videoCount = TOPICS.reduce((a, t) => a + t.videos.length, 0);
  const cmdCount = TOPICS.reduce((a, t) => a + t.cheatsheet.length, 0);
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section id="hero" className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36" aria-label="Introduction">
      {/* ambient hacker glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(600px 300px at 50% 0%, rgba(74,222,128,0.10), transparent 70%), radial-gradient(500px 260px at 80% 20%, rgba(124,92,255,0.08), transparent 70%)",
        }}
      />
      <div ref={heroRef} className="relative mx-auto max-w-6xl px-5 md:px-8">
        {/* overline */}
        <Reveal y={12}>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4ade8040] bg-[#4ade800d] px-4 py-1.5 font-mono text-[11px] tracking-wide text-[#4ade80]">
            <Sparkles className="h-3.5 w-3.5" />
            learn by doing — visuals · notes · videos · challenges
          </p>
        </Reveal>

        <TypedHeadline />

        <Reveal delay={0.15} y={16}>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#8fa2c9] md:text-lg">
            A hands-on learning lab for three skills that separate users from operators:{" "}
            <span className="text-[#e8eefc]">LVM storage</span>, <span className="text-[#e8eefc]">NFS sharing</span> and{" "}
            <span className="text-[#e8eefc]">containers</span>. Animated diagrams you can poke, cheat-sheet notes you can
            copy, verified video lessons, and a practice arena that grades you like LeetCode.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={0.24} y={16}>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <MagneticButton
              accentHex="#7c5cff"
              onClick={() => scrollToSection("lvm")}
              ariaLabel="Start learning with LVM"
              className="px-6 py-3"
            >
              <TerminalSquare className="h-4 w-4 text-[#7c5cff]" />
              start learning
            </MagneticButton>
            <MagneticButton accentHex="#4ade80" onClick={() => scrollToSection("practice")} ariaLabel="Jump to the practice arena" className="px-6 py-3">
              <Target className="h-4 w-4 text-[#4ade80]" />
              practice arena
            </MagneticButton>
            <span className="hidden items-center gap-2 font-mono text-[11px] text-[#64748b] sm:flex">
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">⌘</kbd>
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">K</kbd>
              to search every command
            </span>
          </div>
        </Reveal>

        {/* topic cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TOPICS.map((t, i) => {
            const Icon = TOPIC_ICONS[t.icon];
            return (
              <Reveal key={t.key} delay={0.1 + i * 0.08}>
                <button
                  onClick={() => scrollToSection(sectionIdOf(t.key))}
                  aria-label={`Jump to the ${t.name} chapter`}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/6"
                  style={{ boxShadow: `0 0 0 rgba(0,0,0,0)` }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(220px circle at 50% 0%, rgba(${t.rgb},0.14), transparent 70%)` }}
                  />
                  <div className="relative flex items-start justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${t.accentHex}44`, background: `${t.accentHex}12`, color: t.accentHex }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#64748b]">{t.num}</span>
                  </div>
                  <p className="relative mt-4 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: t.accentHex }}>
                    {t.name}
                  </p>
                  <p className="relative mt-1.5 text-[15px] font-semibold text-[#e8eefc]">{t.title}</p>
                  <p className="relative mt-1 text-[12.5px] leading-relaxed text-[#8fa2c9]">{t.tagline}</p>
                  <p className="relative mt-4 flex items-center gap-1 font-mono text-[11px] text-[#8fa2c9] transition-colors group-hover:text-[#e8eefc]">
                    {t.videos.length} videos · {t.cheatsheet.length} commands · {t.lesson.length} lessons
                  </p>
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* stats strip */}
        <Reveal delay={0.3}>
          <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-white/8 bg-white/3 px-6 py-5 sm:grid-cols-4">
            {[
              { v: 3, suffix: "", label: "deep chapters" },
              { v: cmdCount, suffix: "+", label: "copy-ready commands" },
              { v: videoCount, suffix: "", label: "verified video lessons" },
              { v: CHALLENGES.length, suffix: "", label: "arena challenges" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-2xl font-semibold text-[#e8eefc] md:text-3xl">
                  <Counter value={s.v} suffix={s.suffix} />
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8fa2c9]">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
