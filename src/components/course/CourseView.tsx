"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Layers,
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
import ModulesTab from "@/components/course/ModulesTab";
import { TOPICS, type Topic, type TopicKey } from "@/data/learning";
import { ROUTES, topicRoute, useProgressStore } from "@/lib/store";

type Tab = "modules" | "learn" | "notes" | "videos" | "practice";

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "modules", label: "Modules", icon: <Layers className="h-4 w-4" /> },
  { key: "learn", label: "Lesson", icon: <Eye className="h-4 w-4" /> },
  { key: "notes", label: "Notes", icon: <NotebookPen className="h-4 w-4" /> },
  { key: "videos", label: "Videos", icon: <Youtube className="h-4 w-4" /> },
  { key: "practice", label: "Practice", icon: <Target className="h-4 w-4" /> },
];

/** Restrained tag colors, all from the warm palette. */
const TAG_COLORS: Record<string, string> = {
  wargame: "#6a9bcc",
  labs: "#d97757",
  sandbox: "#788c5d",
  reference: "#73726c",
  course: "#c6613f",
};

/* Lazy wrappers keep the interactive diagrams out of the initial bundle */
const LvmLazy = dynamic(() => import("@/components/visuals/LvmVisual"), { ssr: false });
const NfsLazy = dynamic(() => import("@/components/visuals/NfsVisual"), { ssr: false });
const ContainerLazy = dynamic(() => import("@/components/visuals/ContainerVisual"), { ssr: false });

/** Full-width interactive diagram — the star of the page, sized like a stage. */
function VisualCard({ topic }: { topic: Topic }) {
  return (
    <div className="surface relative overflow-hidden p-6 md:p-9">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(560px circle at 88% 0%, rgba(${topic.rgb},0.06), transparent 70%)`,
        }}
      />
      <p className="kicker relative mb-6 flex items-center gap-2.5 text-[12px]">
        <Eye className="h-4 w-4" style={{ color: topic.accentHex }} />
        interactive diagram — click around
      </p>
      <div className="relative">
        {topic.key === "lvm" && <LvmLazy />}
        {topic.key === "nfs" && <NfsLazy />}
        {topic.key === "docker" && <ContainerLazy />}
      </div>
    </div>
  );
}

function LearnTab({ topic }: { topic: Topic }) {
  return (
    <div className="flex flex-col gap-7">
      <p className="text-[16px] leading-relaxed text-text-secondary">{topic.intro}</p>
      <ol className="flex flex-col gap-6">
        {topic.lesson.map((l, i) => (
          <motion.li
            key={l.heading}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="flex gap-4"
          >
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[13px]"
              style={{ color: topic.accentHex, background: `${topic.accentHex}14` }}
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-[16.5px] font-semibold text-foreground">{l.heading}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{l.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <Link
        href={ROUTES.practice}
        className="group inline-flex w-fit items-center gap-1.5 text-[14px] font-medium transition-colors"
        style={{ color: topic.accentHex }}
      >
        Ready? Prove it in the arena
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function NotesTab({ topic }: { topic: Topic }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="kicker mb-4">key concepts — memorise these</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topic.concepts.map((c) => (
            <div key={c.term} className="rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:border-input">
              <p className="font-mono text-[13px] font-semibold" style={{ color: topic.accentHex }}>
                {c.term}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.def}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="kicker mb-4">cheat sheet — click any command to copy</p>
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
      <p className="kicker">
        hand-picked · {topic.videos.length} verified lessons · opens on youtube
      </p>
      {topic.videos.map((v) => (
        <a
          key={v.id}
          href={`https://www.youtube.com/watch?v=${v.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group surface surface-hover flex items-stretch gap-4 overflow-hidden !rounded-xl p-3"
        >
          <div className="relative h-[76px] w-[134px] shrink-0 overflow-hidden rounded-lg">
            <img
              src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
              alt={`Thumbnail: ${v.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <Play className="ml-0.5 h-4 w-4 fill-[#141413] text-[#141413]" />
              </span>
            </span>
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="line-clamp-2 text-[14.5px] font-medium leading-snug text-foreground">
              {v.title}
            </p>
            <p className="mt-1 font-mono text-[11px]" style={{ color: topic.accentHex }}>
              {v.channel}
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{v.blurb}</p>
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-terracotta" />
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
            className="group surface surface-hover flex items-center gap-3.5 !rounded-xl p-4"
          >
            <span
              className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider"
              style={{ color: TAG_COLORS[p.tag], background: `${TAG_COLORS[p.tag]}14` }}
            >
              {p.tag}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-foreground">{p.name}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{p.blurb}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-terracotta" />
          </a>
        ))}
      </div>
      <Link
        href={ROUTES.practice}
        className="group flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors duration-200 hover:brightness-[0.98]"
        style={{ borderColor: `${topic.accentHex}40`, background: `${topic.accentHex}0f` }}
      >
        <span className="flex items-center gap-2.5 text-[13.5px] font-medium" style={{ color: topic.accentHex }}>
          <Target className="h-4 w-4" />
          Take the {topic.name} challenge in the arena
        </span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: topic.accentHex }} />
      </Link>
    </div>
  );
}

function TabPanel({ topic }: { topic: Topic }) {
  const [tab, setTab] = useState<Tab>("modules");
  return (
    <div className="surface overflow-hidden">
      {/* tab bar */}
      <div role="tablist" aria-label={`${topic.name} learning tabs`} className="flex border-b border-border bg-secondary/40">
        {TAB_ITEMS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              aria-label={t.label}
              onClick={() => setTab(t.key)}
              className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 px-2 py-3.5 font-mono text-[11.5px] uppercase tracking-wider transition-colors duration-150 sm:px-4 ${
                active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {active && (
                <motion.span
                  layoutId={`tab-${topic.key}`}
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full"
                  style={{ background: topic.accentHex }}
                  transition={{ type: "spring", stiffness: 420, damping: 38 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* tab content — generous, page-filling */}
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {tab === "modules" && <ModulesTab topic={topic} />}
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
          className="group surface surface-hover flex items-center gap-3.5 p-4"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
              previous — {prev.num}
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-foreground">
              {prev.name}: {prev.title}
            </span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={topicRoute(next.key)}
          className="group surface surface-hover flex items-center justify-end gap-3.5 p-4 text-right sm:col-start-2"
        >
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
              next — {next.num}
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-foreground">
              {next.name}: {next.title}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <Link
          href={ROUTES.practice}
          className="group flex items-center justify-end gap-3.5 rounded-xl border border-terracotta/40 bg-terracotta-soft p-4 text-right transition-colors hover:border-terracotta sm:col-start-2"
        >
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta-deep">
              path complete — now
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-terracotta-deep">
              prove it in the arena
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-terracotta-deep transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </nav>
  );
}

/* ── The course page — one full-width column, diagram first ─────────── */

export default function CourseView({ topicKey }: { topicKey: TopicKey }) {
  const topic = TOPICS.find((t) => t.key === topicKey)!;
  const completed = useProgressStore((s) => s.completed);
  const markComplete = useProgressStore((s) => s.markComplete);
  const markIncomplete = useProgressStore((s) => s.markIncomplete);
  const isDone = completed.includes(topic.key);

  return (
    <article aria-labelledby={`${topic.key}-title`} className="flex flex-col">
      {/* ── Chapter header ── */}
      <header className="surface relative overflow-hidden p-6 md:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(420px circle at 12% 0%, rgba(${topic.rgb},0.08), transparent 70%)`,
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{ color: topic.accentHex }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-[10px]"
                style={{ background: `${topic.accentHex}14` }}
              >
                {topic.num}
              </span>
              chapter {topic.num} — {topic.name}
            </p>
            <button
              onClick={() => (isDone ? markIncomplete(topic.key) : markComplete(topic.key))}
              aria-pressed={isDone}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-150 ${
                isDone
                  ? "border-sage/40 bg-sage-soft text-sage"
                  : "border-input bg-card text-muted-foreground hover:border-sage/50 hover:text-sage"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {isDone ? "chapter complete" : "mark complete"}
            </button>
          </div>

          <h1
            id={`${topic.key}-title`}
            className="display mt-5 max-w-2xl text-balance text-[34px] leading-[1.15] text-foreground md:text-[46px]"
          >
            {topic.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            {topic.tagline}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              `${topic.modules.length} modules`,
              `${topic.modules.reduce((a, m) => a + m.lessons.length, 0)} lessons`,
              `${topic.concepts.length} concepts`,
              `${topic.cheatsheet.length} commands`,
              `${topic.videos.length} videos`,
              `${topic.practice.length} practice platforms`,
            ].map((m) => (
              <span key={m} className="chip">
                {m}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Full-width content, stacked — diagram is the hero ── */}
      <Reveal className="mt-8" delay={0.03} y={8}>
        <VisualCard topic={topic} />
      </Reveal>
      <Reveal className="mt-6" delay={0.06} y={8}>
        <TabPanel topic={topic} />
      </Reveal>

      <CoursePager topicKey={topic.key} />
    </article>
  );
}
