"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ROUTES, useLabStore } from "@/lib/store";

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
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid max-w-[880px] gap-10 px-5 py-12 md:grid-cols-3 md:px-10">
        <div>
          <p className="display text-[17px] text-foreground">Linux Lab</p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Learn LVM, NFS and containers the hands-on way: interactive diagrams, copy-ready notes,
            verified video lessons and a practice arena that grades you.
          </p>
          <p className="mt-4 font-mono text-[10.5px] text-text-faint">
            © 2026 Linux Lab · built for people who break things on purpose
          </p>
        </div>

        <div>
          <p className="kicker mb-3">Pages</p>
          <ul className="grid grid-cols-2 gap-2">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button onClick={replayIntro} className="btn-ghost mt-4 !px-2.5 !py-1.5 font-mono !text-[10.5px]">
            <RotateCcw className="h-3 w-3" />
            replay the boot intro
          </button>
        </div>

        <div>
          <p className="kicker mb-3">Built with</p>
          <div className="flex flex-wrap gap-1.5">
            {["Next.js", "React 19", "TypeScript", "Tailwind CSS 4", "Framer Motion"].map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 font-mono text-[10.5px] text-text-faint">
            Every external link verified live before shipping.
          </p>
        </div>
      </div>
    </footer>
  );
}
