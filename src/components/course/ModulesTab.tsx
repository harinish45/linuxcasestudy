"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Circle } from "lucide-react";
import CommandChip from "@/components/CommandChip";
import { lessonKey, moduleStats, type Topic } from "@/data/learning";
import { useProgressStore } from "@/lib/store";

/**
 * Modules tab — the course as a structured curriculum: module accordion,
 * per-lesson ticks (persisted locally), module progress bars and the
 * copy-ready command attached to hands-on lessons. Sized to fill the page.
 */
export default function ModulesTab({ topic }: { topic: Topic }) {
  const lessonsDone = useProgressStore((s) => s.lessonsDone);
  const toggleLesson = useProgressStore((s) => s.toggleLesson);
  const doneSet = useMemo(() => new Set<string>(lessonsDone), [lessonsDone]);
  const stats = moduleStats(topic, doneSet);
  const allDone = stats.totalLessons > 0 && stats.doneLessons === stats.totalLessons;

  // Open the first module that still has unticked lessons (computed on mount).
  const [openId, setOpenId] = useState<string>(() => {
    const firstUndone = topic.modules.find((m) =>
      m.lessons.some((l) => !doneSet.has(lessonKey(topic.key, m.id, l.id)))
    );
    return firstUndone?.id ?? topic.modules[0]?.id ?? "";
  });

  return (
    <div className="flex flex-col gap-5">
      {/* course-level summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14.5px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {stats.doneLessons} of {stats.totalLessons}
          </span>{" "}
          lessons done · {stats.modulesDone}/{stats.totalModules} modules · ~{stats.minutes} min
          total
        </p>
        {allDone && (
          <span
            className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-sage"
            style={{ background: "var(--sage-soft)" }}
          >
            module path complete
          </span>
        )}
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={stats.pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`progress-fill ${allDone ? "progress-fill-sage" : ""}`}
          style={{ width: `${Math.max(stats.pct, 2)}%` }}
        />
      </div>

      {/* module accordion */}
      <div className="flex flex-col gap-3">
        {topic.modules.map((m, mi) => {
          const doneCount = m.lessons.filter((l) => doneSet.has(lessonKey(topic.key, m.id, l.id))).length;
          const complete = doneCount === m.lessons.length && m.lessons.length > 0;
          const open = openId === m.id;
          const mins = m.lessons.reduce((a, l) => a + l.minutes, 0);
          const pct = Math.round((doneCount / m.lessons.length) * 100);
          return (
            <div key={m.id} className="surface overflow-hidden">
              {/* module header */}
              <button
                onClick={() => setOpenId(open ? "" : m.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-secondary/40"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-[14px]"
                  style={
                    complete
                      ? { color: "var(--sage)", background: "var(--sage-soft)" }
                      : { color: topic.accentHex, background: `${topic.accentHex}14` }
                  }
                >
                  {complete ? <Check className="h-5 w-5" /> : String(mi + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5">
                    <span className="truncate text-[16px] font-medium text-foreground">
                      {m.title}
                    </span>
                    {complete && (
                      <span className="hidden font-mono text-[9.5px] uppercase tracking-wider text-sage sm:inline">
                        done
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[13.5px] text-muted-foreground">
                    {m.summary}
                  </span>
                </span>
                <span className="hidden shrink-0 text-right font-mono text-[11px] text-text-faint sm:block">
                  {doneCount}/{m.lessons.length} · ~{mins}m
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-text-faint transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* lessons */}
              {open && (
                <div className="border-t border-border">
                  <div className="px-5 pt-3.5">
                    <div className="progress-track h-[4px]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: complete ? "var(--sage)" : topic.accentHex,
                          transition: "width 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      />
                    </div>
                  </div>
                  <ul className="flex flex-col py-2.5">
                    {m.lessons.map((l, li) => {
                      const isDone = doneSet.has(lessonKey(topic.key, m.id, l.id));
                      return (
                        <li key={l.id} className={li > 0 ? "border-t border-border/60" : ""}>
                          <div className="flex items-start gap-3.5 px-5 py-3.5">
                            <button
                              onClick={() => toggleLesson(topic.key, m.id, l.id)}
                              aria-pressed={isDone}
                              aria-label={`Mark "${l.title}" as ${isDone ? "not done" : "done"}`}
                              className={`mt-1 shrink-0 rounded-sm transition-colors duration-150 ${
                                isDone ? "text-sage" : "text-text-faint hover:text-foreground"
                              }`}
                            >
                              {isDone ? (
                                <Check className="h-[19px] w-[19px]" strokeWidth={2.2} />
                              ) : (
                                <Circle className="h-[17px] w-[17px]" strokeWidth={1.8} />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-[15px] leading-snug ${
                                  isDone
                                    ? "text-muted-foreground line-through decoration-border"
                                    : "text-foreground"
                                }`}
                              >
                                {l.title}
                              </p>
                              {l.cmd && (
                                <div className="mt-2.5">
                                  <CommandChip cmd={l.cmd} accentHex={topic.accentHex} compact />
                                </div>
                              )}
                            </div>
                            <span className="mt-1 shrink-0 font-mono text-[11px] text-text-faint">
                              {l.minutes}m
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[10.5px] text-text-faint">
        ticks save locally as you go — your pace, your record.
      </p>
    </div>
  );
}
