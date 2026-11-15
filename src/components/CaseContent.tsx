"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, CircleAlert, Wrench } from "lucide-react";
import Reveal from "@/components/Reveal";
import CommandChip from "@/components/CommandChip";
import SectionHeading from "@/components/SectionHeading";
import SpotlightCard from "@/components/SpotlightCard";
import type { CaseMeta, ImplementationStep, TroubleshootingRow, VerificationRow } from "@/data/types";

interface Props {
  meta: CaseMeta;
  steps: ImplementationStep[];
  verification: VerificationRow[];
  troubleshooting: TroubleshootingRow[];
  accentHex: string;
  extra?: React.ReactNode;
}

/** Shared case-study body: summary, problem, implementation, verification, troubleshooting. */
export default function CaseContent({ meta, steps, verification, troubleshooting, accentHex, extra }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
      <SectionHeading
        kicker={`Case study ${meta.num} — ${meta.tagline}`}
        title={meta.title}
        accentHex={accentHex}
      />
      {extra}

      {/* executive summary + business problem */}
      <div className="mb-14 grid gap-5 lg:grid-cols-2">
        <Reveal className="h-full">
          <SpotlightCard className="glass h-full rounded-2xl p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: accentHex }}>
              Executive summary
            </p>
            <p className="text-sm leading-relaxed text-[#b9c6e4] md:text-[15px]">{meta.execSummary}</p>
          </SpotlightCard>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-5">
          <SpotlightCard className="glass rounded-2xl p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#f59e0b]">
              Business problem
            </p>
            <p className="text-sm leading-relaxed text-[#b9c6e4] md:text-[15px]">{meta.problem}</p>
          </SpotlightCard>
          <SpotlightCard className="glass rounded-2xl p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#34d399]">
              Outcome
            </p>
            <p className="text-sm leading-relaxed text-[#b9c6e4] md:text-[15px]">{meta.outcome}</p>
          </SpotlightCard>
        </Reveal>
      </div>

      {/* implementation steps */}
      <Reveal className="mb-14">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-[#e8eefc]">
          <Wrench className="h-4 w-4" style={{ color: accentHex }} />
          Implementation steps
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-[#8fa2c9]">
            click to expand · chips copy on click
          </span>
        </h3>
        <Accordion type="single" collapsible className="glass overflow-hidden rounded-2xl px-5">
          {steps.map((step, i) => (
            <AccordionItem key={step.id} value={step.id} className={i === steps.length - 1 ? "border-b-0" : ""}>
              <AccordionTrigger className="py-4 text-left font-mono text-[13px] tracking-wide text-[#e8eefc] hover:text-white hover:no-underline">
                {step.title}
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-[#8fa2c9]">{step.description}</p>
                <div className="flex max-w-3xl flex-col gap-2">
                  {step.commands.map((c, j) => (
                    <CommandChip key={j} cmd={c.cmd} note={c.note} accentHex={accentHex} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>

      {/* verification results */}
      <Reveal className="mb-14">
        <h3 className="mb-5 text-lg font-semibold text-[#e8eefc]">Verification results</h3>
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-wider text-[#8fa2c9]">
                <th className="px-5 py-3.5 font-medium">Check</th>
                <th className="px-5 py-3.5 font-medium">Expected</th>
                <th className="px-5 py-3.5 font-medium">Observed</th>
                <th className="px-5 py-3.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {verification.map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-[#e8eefc]">{row.command}</td>
                  <td className="px-5 py-3.5 text-[#8fa2c9]">{row.expect}</td>
                  <td className="px-5 py-3.5 text-[#b9c6e4]">{row.result}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> pass
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* troubleshooting */}
      <Reveal>
        <h3 className="mb-5 text-lg font-semibold text-[#e8eefc]">Troubleshooting field notes</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {troubleshooting.map((t, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <p className="mb-2 flex items-start gap-2 font-mono text-[12.5px] leading-snug text-[#f87171]">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t.symptom}
              </p>
              <p className="mb-1.5 text-[12.5px] leading-relaxed text-[#8fa2c9]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">cause · </span>
                {t.cause}
              </p>
              <p className="text-[12.5px] leading-relaxed text-[#b9c6e4]">
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: accentHex }}>
                  fix ·{" "}
                </span>
                {t.fix}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
