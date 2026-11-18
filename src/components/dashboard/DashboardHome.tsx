"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  HardDrive,
  Network,
  Container,
  Target,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Workflow,
  TerminalSquare,
  Compass,
  Sparkles,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import Counter from "@/components/Counter";
import { TOPICS, CHALLENGES, moduleStats, type Topic } from "@/data/learning";
import { ROUTES, topicRoute, useProgressStore, type TopicKey } from "@/lib/store";

const TOPIC_ICONS = { harddrive: HardDrive, network: Network, container: Container } as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Small status dot for course rows. */
function StatusPill({ done }: { done: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-sage">
      <CheckCircle2 className="h-3 w-3" />
      complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
      <Circle className="h-3 w-3" />
      in progress
    </span>
  );
}

export default function DashboardHome() {
  const completed = useProgressStore((s) => s.completed);
  const lastCourse = useProgressStore((s) => s.lastCourse);
  const lessonsDone = useProgressStore((s) => s.lessonsDone);

  const statsByKey = useMemo(() => {
    const map = new Map<string, ReturnType<typeof moduleStats>>();
    for (const t of TOPICS) map.set(t.key, moduleStats(t, lessonsDone));
    return map;
  }, [lessonsDone]);

  const videoCount = TOPICS.reduce((a, t) => a + t.videos.length, 0);
  const cmdCount = TOPICS.reduce((a, t) => a + t.cheatsheet.length, 0);

  const continueTopic: Topic =
    TOPICS.find((t) => topicRoute(t.key) === lastCourse && !completed.includes(t.key)) ??
    TOPICS.find((t) => !completed.includes(t.key)) ??
    TOPICS[0];
  const nextTopic: Topic | undefined = TOPICS.find((t) => !completed.includes(t.key));
  const pct = Math.round((completed.length / TOPICS.length) * 100);
  const allDone = completed.length === TOPICS.length;

  const ContinueIcon = TOPIC_ICONS[continueTopic.icon];
  const NextIcon = nextTopic ? TOPIC_ICONS[nextTopic.icon] : null;

  const activity: { label: string; detail: string }[] = [];
  if (lastCourse) {
    const t = TOPICS.find((x) => topicRoute(x.key) === lastCourse);
    if (t) activity.push({ label: `Opened ${t.name}: ${t.title}`, detail: "most recent course visit" });
  }
  for (const key of [...completed].reverse() as TopicKey[]) {
    const t = TOPICS.find((x) => x.key === key);
    if (t) activity.push({ label: `Completed ${t.name}: ${t.title}`, detail: `chapter ${t.num}` });
  }
  if (activity.length === 0) {
    activity.push({ label: "Welcome to the lab", detail: "your journey starts below" });
  }

  return (
    <div className="flex flex-col gap-14">
      {/* ── Editorial greeting ───────────────────────────────── */}
      <section aria-label="Welcome">
        <Reveal y={8}>
          <p className="kicker mb-4 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
            learn by doing — visuals · notes · videos · challenges
          </p>
        </Reveal>
        <Reveal delay={0.05} y={10}>
          <h1 className="display max-w-2xl text-balance text-[34px] leading-[1.15] text-foreground md:text-[42px]">
            {greeting()}. Ready for the next lab?
          </h1>
        </Reveal>
        <Reveal delay={0.1} y={10}>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
            Three skills that separate users from operators —{" "}
            <span className="text-foreground">LVM storage</span>,{" "}
            <span className="text-foreground">NFS sharing</span> and{" "}
            <span className="text-foreground">containers</span> — taught with interactive diagrams,
            cheat-sheets, verified video lessons and an arena that grades you.
          </p>
        </Reveal>
      </section>

      {/* ── Continue learning ────────────────────────────────── */}
      <section aria-labelledby="continue-heading">
        <Reveal y={8}>
          <p className="kicker mb-3">continue learning</p>
        </Reveal>
        <Reveal delay={0.05} y={10}>
          <div className="surface surface-hover p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    color: continueTopic.accentHex,
                    background: `${continueTopic.accentHex}14`,
                  }}
                >
                  <ContinueIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-faint">
                    chapter {continueTopic.num} — {continueTopic.name}
                  </p>
                  <p className="display mt-0.5 truncate text-[19px] text-foreground">
                    {continueTopic.title}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {continueTopic.tagline}
                  </p>
                </div>
              </div>
              <Link href={topicRoute(continueTopic.key)} className="btn-primary shrink-0">
                <PlayCircle className="h-4 w-4" />
                {completed.length > 0 ? "Resume" : "Start learning"}
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="progress-track flex-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-fill" style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {completed.length}/{TOPICS.length} chapters
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── My courses ───────────────────────────────────────── */}
      <section aria-labelledby="courses-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="kicker">my courses</p>
            <h2 id="courses-heading" className="display mt-1 text-[24px] text-foreground">
              Three chapters, one stack
            </h2>
          </div>
          <p className="hidden font-mono text-[10.5px] text-text-faint sm:block">
            {completed.length}/3 complete
          </p>
        </div>

        <div className="surface overflow-hidden">
          {TOPICS.map((t, i) => {
            const Icon = TOPIC_ICONS[t.icon];
            const done = completed.includes(t.key);
            const st = statsByKey.get(t.key);
            return (
              <Link
                key={t.key}
                href={topicRoute(t.key)}
                aria-label={`Open the ${t.name} course`}
                className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ color: t.accentHex, background: `${t.accentHex}12` }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-text-faint">{t.num}</span>
                    <span className="truncate text-[14.5px] font-medium text-foreground">
                      {t.title}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                    {st ? `${st.modulesDone}/${st.totalModules} modules` : ""} · {st ? `${st.doneLessons}/${st.totalLessons} lessons` : ""} · {t.cheatsheet.length} commands · {t.videos.length} videos
                  </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <StatusPill done={done} />
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-terracotta"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Progress + activity ──────────────────────────────── */}
      <section aria-labelledby="progress-heading" className="grid gap-4 md:grid-cols-2">
        <Reveal y={8}>
          <div className="surface h-full p-5">
            <p className="kicker mb-4">learning progress</p>
            <h2 id="progress-heading" className="sr-only">
              Learning progress
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="display text-[36px] text-foreground">
                <Counter value={pct} />
              </span>
              <span className="text-[14px] text-muted-foreground">% of the path</span>
            </div>
            <div className="progress-track mt-3">
              <div className="progress-fill progress-fill-sage" style={{ width: `${pct}%` }} />
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {TOPICS.map((t) => {
                const done = completed.includes(t.key);
                const st = statsByKey.get(t.key);
                return (
                  <li key={t.key} className="flex items-center gap-2.5 text-[13px]">
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sage" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-text-faint" />
                    )}
                    <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>
                      {t.num} · {t.name}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-text-faint">
                      {st ? `${st.doneLessons}/${st.totalLessons} lessons` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>

        <Reveal y={8} delay={0.05}>
          <div className="surface h-full p-5">
            <p className="kicker mb-4">recent activity</p>
            <ul className="flex flex-col">
              {activity.slice(0, 5).map((a, i) => (
                <li
                  key={`${a.label}-${i}`}
                  className={`flex items-start gap-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: a.detail.includes("Completed") ? "var(--sage)" : "var(--terracotta)" }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] text-foreground">{a.label}</span>
                    <span className="block font-mono text-[10px] text-text-faint">{a.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ── Recommended next ─────────────────────────────────── */}
      <section aria-labelledby="next-heading">
        <Reveal y={8}>
          <p className="kicker mb-3">up next</p>
        </Reveal>
        <Reveal y={10} delay={0.05}>
          <div className="surface surface-hover flex flex-wrap items-center justify-between gap-4 p-5">
            {allDone || !nextTopic || !NextIcon ? (
              <>
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-terracotta-soft text-terracotta-deep">
                    <Target className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-medium text-foreground">
                      Path complete — prove it in the arena
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {CHALLENGES.length} graded challenges are waiting for you.
                    </p>
                  </div>
                </div>
                <Link href={ROUTES.practice} className="btn-primary shrink-0">
                  Open the arena
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: nextTopic.accentHex, background: `${nextTopic.accentHex}14` }}
                  >
                    <NextIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-medium text-foreground">
                      Recommended: chapter {nextTopic.num} — {nextTopic.name}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{nextTopic.tagline}</p>
                  </div>
                </div>
                <Link href={topicRoute(nextTopic.key)} className="btn-secondary shrink-0">
                  Go to chapter
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </section>

      {/* ── Quick links ──────────────────────────────────────── */}
      <section aria-label="Quick links" className="grid gap-4 md:grid-cols-3">
        {[
          {
            href: ROUTES.pipeline,
            icon: <Workflow className="h-4 w-4" />,
            hex: "#d97757",
            title: "Integration pipeline",
            body: "Grow one volume and watch storage → NFS → containers react live.",
          },
          {
            href: ROUTES.terminal,
            icon: <TerminalSquare className="h-4 w-4" />,
            hex: "#6a9bcc",
            title: "Terminal lab",
            body: "Scripted scenarios type themselves — then copy or download the .sh.",
          },
          {
            href: ROUTES.resources,
            icon: <Compass className="h-4 w-4" />,
            hex: "#788c5d",
            title: "More places to practise",
            body: "OverTheWire, Killercoda, KodeKloud and more — all verified.",
          },
        ].map((q, i) => (
          <Reveal key={q.href} delay={0.05 * i} y={8}>
            <Link
              href={q.href}
              className="group surface surface-hover flex h-full items-center gap-4 p-4"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ color: q.hex, background: `${q.hex}12` }}
              >
                {q.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-foreground">{q.title}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                  {q.body}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-terracotta" />
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <Reveal y={8}>
        <div className="surface grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
          {[
            { v: 3, suffix: "", label: "deep chapters" },
            { v: cmdCount, suffix: "+", label: "copy-ready commands" },
            { v: videoCount, suffix: "", label: "verified video lessons" },
            { v: CHALLENGES.length, suffix: "", label: "arena challenges" },
          ].map((s) => (
            <div key={s.label} className="bg-card px-6 py-5 text-center">
              <p className="display text-[26px] text-foreground">
                <Counter value={s.v} suffix={s.suffix} />
              </p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-faint">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
