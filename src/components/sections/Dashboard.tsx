"use client";

import { Boxes, Container, Database, FolderGit2, FileDown, FileText, HardDrive } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import StatCard from "@/components/StatCard";
import CompareSlider from "@/components/CompareSlider";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/providers/ToastProvider";

const VIOLET = "#7c5cff";
const CYAN = "#22d3ee";
const EMERALD = "#34d399";

export default function Dashboard() {
  const { push } = useToast();

  return (
    <section id="dashboard" className="relative pt-10">
      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <SectionHeading
          kicker="Verification dashboard"
          title="The lab, at a glance"
          description="Final numbers after all three case studies ran to completion — every metric below was measured live in the scenarios above, not typed in by hand."
          accentHex={VIOLET}
        />

        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<HardDrive className="h-4 w-4" style={{ color: VIOLET }} />}
            label="physical volumes"
            value={4}
            delta="+1 · /dev/sde hot-added"
            data={[1, 2, 3, 3, 4]}
            accentHex={VIOLET}
            delay={0}
          />
          <StatCard
            icon={<Database className="h-4 w-4" style={{ color: VIOLET }} />}
            label="vg free space"
            value={9.0}
            decimals={1}
            suffix="GB"
            delta="16G pool · 7G allocated"
            data={[2, 2.5, 5, 7, 9]}
            accentHex="#a78bfa"
            delay={0.06}
          />
          <StatCard
            icon={<FolderGit2 className="h-4 w-4" style={{ color: CYAN }} />}
            label="exports active"
            value={3}
            delta="3/3 clients mounted · 2049 open"
            data={[0, 1, 2, 3, 3]}
            accentHex={CYAN}
            delay={0.12}
          />
          <StatCard
            icon={<Container className="h-4 w-4" style={{ color: EMERALD }} />}
            label="containers healthy"
            value={6}
            delta="0.2s boot · volumes attached"
            data={[2, 3, 4, 5, 6]}
            accentHex={EMERALD}
            delay={0.18}
          />
        </div>

        <Reveal className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#e8eefc]">Fixed partitions → LVM pool</h3>
            <span className="hidden font-mono text-[10.5px] uppercase tracking-widest text-[#8fa2c9] md:inline">
              drag the handle · or use ← →
            </span>
          </div>
          <CompareSlider />
        </Reveal>

        <Reveal delay={0.1} className="glass flex flex-col items-center justify-between gap-5 rounded-2xl p-6 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7c5cff44] bg-[#7c5cff1a]">
              <Boxes className="h-4.5 w-4.5 text-[#7c5cff]" />
            </span>
            <div>
              <p className="text-[15px] font-medium text-[#e8eefc]">Full written report</p>
              <p className="text-[12.5px] text-[#8fa2c9]">
                Executive summary, method, verification logs and troubleshooting for all three case studies.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <MagneticButton
              onClick={() =>
                push({
                  title: "Report view",
                  description: "Everything on this page IS the report — each section maps to a report chapter.",
                  tone: "info",
                })
              }
              accentHex={VIOLET}
              cursorLabel="open"
              className="!px-4 !py-2.5 text-[12.5px]"
            >
              <FileText className="h-4 w-4 text-[#7c5cff]" />
              View full report
            </MagneticButton>
            <MagneticButton
              onClick={() =>
                push({
                  title: "PDF export placeholder",
                  description: "The PDF deliverable ships alongside this site — wire it here when it lands.",
                  tone: "info",
                })
              }
              cursorLabel="save"
              className="!px-4 !py-2.5 text-[12.5px]"
            >
              <FileDown className="h-4 w-4 text-[#8fa2c9]" />
              Download PDF
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
