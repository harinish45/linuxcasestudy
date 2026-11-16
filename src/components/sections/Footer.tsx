"use client";

import Link from "next/link";
import { TerminalSquare, RotateCcw } from "lucide-react";
import { ROUTES, useLabStore } from "@/lib/store";

const STACK = [
  "Next.js · App Router",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "Framer Motion",
  "lucide-react",
];

const LINKS: [string, string][] = [
  ["Dashboard", ROUTES.home],
  ["LVM", ROUTES.lvm],
  ["NFS", ROUTES.nfs],
  ["Containers", ROUTES.containers],
  ["Challenge Arena", ROUTES.practice],
  ["Terminal Lab", ROUTES.terminal],
  ["Pipeline", ROUTES.pipeline],
  ["Resources", ROUTES.resources],
];

export default function Footer() {
  const replayIntro = useLabStore((s) => s.replayIntro);

  return (
    <footer className="mt-10 border-t border-white/8 bg-[#05070f]/80 backdrop-blur">
      <div className="mx-auto grid max-w-[1060px] gap-10 px-5 py-12 md:grid-cols-3 md:px-10">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#8fa2c9]">
            <TerminalSquare className="h-3.5 w-3.5 text-[#4ade80]" />
            linux lab
          </p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[#8fa2c9]">
            Learn LVM, NFS and containers the hands-on way: animated diagrams, copy-ready notes, verified video
            lessons and a practice arena that grades you.
          </p>
          <p className="mt-4 font-mono text-[11px] text-[#64748b]">
            © 2026 Linux Lab · built for people who break things on purpose
          </p>
        </div>

        <div>
          <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">Pages</p>
          <ul className="grid grid-cols-2 gap-2">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-[13px] text-[#b9c6e4] transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            onClick={replayIntro}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:border-[#4ade8066] hover:text-[#4ade80]"
          >
            <RotateCcw className="h-3 w-3" />
            replay the boot intro
          </button>
        </div>

        <div>
          <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.25em] text-[#8fa2c9]">Built with</p>
          <div className="flex flex-wrap gap-1.5">
            {STACK.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 font-mono text-[10.5px] text-[#8fa2c9]"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] text-[#64748b]">
            Every external link verified live before shipping.
          </p>
        </div>
      </div>
    </footer>
  );
}
