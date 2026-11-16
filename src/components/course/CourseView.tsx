"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  NotebookPen,
  Youtube,
  Target,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Play,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import CommandChip from "@/components/CommandChip";
import { TOPICS, type Topic, type TopicKey } from "@/data/learning";
import { ROUTES, topicRoute, useProgressStore } from "@/lib/store";

type Tab = "learn" | "notes" | "videos" | "practice";

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "learn", label: "Lesson", icon: <Eye className="h-3.5 w-3.5" /> },
  { key: "notes", label: "Notes", icon: <NotebookPen className="h-3.5 w-3.5" /> },
  { key: "videos", label: "Videos", icon: <Youtube className="h-3.5 w-3.5" /> },
  { key: "practice", label: "Practice", icon: <Target className="h-3.5 w-3.5" /> },
];

const TAG_COLORS: Record<string, string> = {
  wargame: "#fbbf24",
  labs: "#7c5cff",
  sandbox: "#34d399",
  reference: "#22d3ee",
  course: "#f472b6",
};

/* Lazy wrappers keep the interactive diagrams out of the initial bundle */
const LvmLazy = dynamic(() => import("@/components/visuals/LvmVisual"), { ssr: false });
const NfsLazy = dynamic(() => import("@/components/visuals/NfsVisual"), { ssr: false });
const ContainerLazy = dynamic(() => import("@/components/visuals/ContainerVisual"), { ssr: false });

function VisualCard({ topic }: { topic: Topic }) {
  return (
    <div
      className="glass rounded-2xl p-5 md:p-6"
      style={{ boxShadow: `0 0 60px rgba(${topic.rgb},0.08)` }}
    >
      <p className="mb-4 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">
        <Eye className="h-3.5 w-3.5" style={{ color: topic.accentHex }} />
        interactive diagram — click around
      </p>
      {topic.key === "lvm" && <LvmLazy />}
      {topic.key === "nfs" && <NfsLazy />}
      {topic.key === "docker" && <ContainerLazy />}
    </div>
  );
}

function LearnTab({ topic }: { topic: Topic }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[15px] leading-relaxed text-[#b9c6e4]">{topic.intro}</p>
      <ol className="flex flex-col gap-4">
        {topic.lesson.map((l, i) => (
          <motion.li
            key={l.heading}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex gap-3.5"
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs"
              style={{ borderColor: `${topic.accentHex}55`, color: topic.accentHex, background: `${topic.accentHex}12` }}
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-[#e8eefc]">{l.heading}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#8fa2c9]">{l.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <Link
        href={ROUTES.practice}
        className="group inline-flex w-fit items-center gap-1.5 font-mono text-xs transition-colors"
        style={{ color: topic.accentHex }}
      >
        ready? prove it in the arena
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function NotesTab({ topic }: { topic: Topic }) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">
          key concepts — memorise these
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {topic.concepts.map((c) => (
            <div key={c.term} className="rounded-xl border border-white/8 bg-white/3 p-3.5 transition-colors hover:border-white/20">
              <p className="font-mono text-xs font-semibold" style={{ color: topic.accentHex }}>
                {c.term}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#8fa2c9]">{c.def}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">
          cheat sheet — click any command to copy
        </p>
        <div className="flex flex-col gap-2">
          {topic.cheatsheet.map((c) => (
            <CommandChip key={c.cmd} cmd={c.cmd} note={c.note} accentHex={topic.accentHex} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideosTab({ topic }: { topic: Topic }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">
        hand-picked · {topic.videos.length} verified lessons · opens on youtube
      </p>
      {topic.videos.map((v) => (
        <a
          key={v.id}
          href={`https://www.youtube.com/watch?v=${v.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-stretch gap-3.5 overflow-hidden rounded-xl border border-white/8 bg-white/3 p-3 transition-all duration-300 hover:border-white/25 hover:bg-white/6"
        >
          <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg">
            <img
              src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
              alt={`Thumbnail: ${v.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: topic.accentHex }}>
                <Play className="ml-0.5 h-3.5 w-3.5 fill-black text-black" />
              </span>
            </span>
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-[#e8eefc] transition-colors group-hover:text-white">
              {v.title}
            </p>
            <p className="mt-1 font-mono text-[10.5px]" style={{ color: topic.accentHex }}>
              {v.channel}
            </p>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-[#8fa2c9]">{v.blurb}</p>
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#64748b] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
        </a>
      ))}
    </div>
  );
}

function PracticeTab({ topic }: { topic: Topic }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        {topic.practice.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/3 p-3.5 transition-all duration-300 hover:border-white/25 hover:bg-white/6"
          >
            <span
              className="rounded-md border px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider"
              style={{ borderColor: `${TAG_COLORS[p.tag]}55`, color: TAG_COLORS[p.tag], background: `${TAG_COLORS[p.tag]}12` }}
            >
              {p.tag}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium text-[#e8eefc]">{p.name}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-[#8fa2c9]">{p.blurb}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#64748b] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
          </a>
        ))}
      </div>
      <Link
        href={ROUTES.practice}
        className="group flex items-center justify-between rounded-xl border px-4 py-3.5 transition-all duration-300 hover:brightness-125"
        style={{ borderColor: `${topic.accentHex}55`, background: `${topic.accentHex}10` }}
      >
        <span className="flex items-center gap-2.5 font-mono text-xs" style={{ color: topic.accentHex }}>
          <Target className="h-4 w-4" />
          take the {topic.name} challenge in the arena
        </span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: topic.accentHex }} />
      </Link>
    </div>
  );
}

function TabPanel({ topic }: { topic: Topic }) {
  const [tab, setTab] = useState<Tab>("learn");
  return (
    <div className="glass rounded-2xl">
      {/* tab bar */}
      <div role="tablist" aria-label={`${topic.name} learning tabs`} className="flex border-b border-white/8">
        {TAB_ITEMS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                active ? "text-[#e8eefc]" : "text-[#8fa2c9] hover:text-[#e8eefc]"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {active && (
                <motion.span
                  layoutId={`tab-${topic.key}`}
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full"
                  style={{ background: topic.accentHex, boxShadow: `0 0 12px ${topic.accentHex}` }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* tab content */}
      <div className="p-5 md:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {tab === "learn" && <LearnTab topic={topic} />}
            {tab === "notes" && <NotesTab topic={topic} />}
            {tab === "videos" && <VideosTab topic={topic} />}
            {tab === "practice" && <PracticeTab topic={topic} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Page-level prev/next navigation ─────────────────────────────────── */

function CoursePager({ topicKey }: { topicKey: TopicKey }) {
  const idx = TOPICS.findIndex((t) => t.key === topicKey);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  return (
    <nav aria-label="Course navigation" className="mt-14 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={topicRoute(prev.key)}
          className="group flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/4 p-4 transition-all duration-300 hover:border-white/25 hover:bg-white/6"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-[#8fa2c9] transition-transform group-hover:-translate-x-1" />
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#64748b]">
              previous — {prev.num}
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-[#e8eefc]">{prev.name}: {prev.title}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={topicRoute(next.key)}
          className="group flex items-center justify-end gap-3.5 rounded-2xl border border-white/8 bg-white/4 p-4 text-right transition-all duration-300 hover:border-white/25 hover:bg-white/6 sm:col-start-2"
        >
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#64748b]">
              next — {next.num}
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-[#e8eefc]">{next.name}: {next.title}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#8fa2c9] transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <Link
          href={ROUTES.practice}
          className="group flex items-center justify-end gap-3.5 rounded-2xl border border-[#4ade8055] bg-[#4ade800d] p-4 text-right transition-all duration-300 hover:border-[#4ade8099] sm:col-start-2"
        >
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#64748b]">
              path complete — now
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-[#4ade80]">prove it in the arena</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#4ade80] transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </nav>
  );
}

/* ── The course page ─────────────────────────────────────────────────── */

export default function CourseView({ topicKey }: { topicKey: TopicKey }) {
  const topic = TOPICS.find((t) => t.key === topicKey)!;
  const completed = useProgressStore((s) => s.completed);
  const markComplete = useProgressStore((s) => s.markComplete);
  const markIncomplete = useProgressStore((s) => s.markIncomplete);
  const isDone = completed.includes(topic.key);

  return (
    <article aria-labelledby={`${topic.key}-title`} className="flex flex-col">
      {/* ── Chapter header ── */}
      <header className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(420px circle at 12% 0%, rgba(${topic.rgb},0.14), transparent 70%)` }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: topic.accentHex }}>
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md border text-[10px]"
                style={{ borderColor: `${topic.accentHex}55`, background: `${topic.accentHex}14` }}
              >
                {topic.num}
              </span>
              chapter {topic.num} — {topic.name}
            </p>
            <button
              onClick={() => (isDone ? markIncomplete(topic.key) : markComplete(topic.key))}
              aria-pressed={isDone}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 font-mono text-[11px] transition-all duration-300 ${
                isDone
                  ? "border-[#34d39966] bg-[#34d39914] text-[#34d399]"
                  : "border-white/12 bg-white/4 text-[#8fa2c9] hover:border-[#34d39966] hover:text-[#34d399]"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {isDone ? "chapter complete" : "mark complete"}
            </button>
          </div>

          <h1 id={`${topic.key}-title`} className="mt-4 text-3xl font-semibold tracking-tight text-[#e8eefc] md:text-5xl">
            {topic.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8fa2c9] md:text-lg">{topic.tagline}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              `${topic.lesson.length} lessons`,
              `${topic.concepts.length} concepts`,
              `${topic.cheatsheet.length} commands`,
              `${topic.videos.length} videos`,
              `${topic.practice.length} practice platforms`,
            ].map((m) => (
              <span key={m} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10.5px] text-[#8fa2c9]">
                {m}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content grid ── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-5" delay={0.05}>
          <div className="lg:sticky lg:top-20">
            <VisualCard topic={topic} />
          </div>
        </Reveal>
        <Reveal className="lg:col-span-7" delay={0.1}>
          <TabPanel topic={topic} />
        </Reveal>
      </div>

      <CoursePager topicKey={topic.key} />
    </article>
  );
}
