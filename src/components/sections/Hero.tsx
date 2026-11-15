"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Command, Database, FolderGit2, Search, Boxes } from "lucide-react";
import SceneShell from "@/components/three/SceneShell";
import { RackPoster } from "@/components/three/fallbacks";
import Ticker from "@/components/Ticker";
import MagneticButton from "@/components/MagneticButton";
import { ACCENTS, useLabStore, type AccentKey } from "@/lib/store";
import { scrollToSection } from "@/lib/scroll";

const ServerRack = dynamic(() => import("@/components/three/ServerRack"), { ssr: false });

const FRAGMENTS = [
  { text: "sudo pvcreate /dev/sdb /dev/sdc /dev/sdd", top: "16%", left: "6%", delay: "0s", blur: "blur-[2px]" },
  { text: "lvextend -L +2G -r /dev/vg_lab/lv_data", top: "30%", left: "72%", delay: "1.2s", blur: "blur-[3px]" },
  { text: "exportfs -ra && showmount -e n10", top: "58%", left: "4%", delay: "2.1s", blur: "blur-[2px]" },
  { text: "mount -t nfs -o rw,sync n10:/srv/nfs/shared /mnt", top: "70%", left: "60%", delay: "0.7s", blur: "blur-[3px]" },
  { text: "docker run -d --name web -v lab_data:/data", top: "12%", left: "58%", delay: "2.8s", blur: "blur-[2px]" },
  { text: "chmod 2775 /srv/nfs/shared  # setgid", top: "82%", left: "30%", delay: "1.7s", blur: "blur-[3px]" },
];

const JUMP: { key: AccentKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "lvm", label: "LVM", icon: <Database className="h-4 w-4" />, desc: "storage that grows" },
  { key: "nfs", label: "NFS", icon: <FolderGit2 className="h-4 w-4" />, desc: "one share, every machine" },
  { key: "docker", label: "Containers", icon: <Boxes className="h-4 w-4" />, desc: "ship it once" },
];

function SpringTitle() {
  const reduced = useReducedMotion();
  const word1 = "Comprehensive";
  const word2 = "Linux";
  const renderWord = (word: string, offset: number, className: string) =>
    word.split("").map((ch, i) => (
      <motion.span
        key={`${word}-${i}`}
        className={`inline-block ${className}`}
        initial={{ opacity: 0, y: reduced ? 0 : 46, rotateX: reduced ? 0 : -80 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.25 + (offset + i) * 0.038, type: "spring", stiffness: 240, damping: 19 }}
      >
        {ch}
      </motion.span>
    ));

  return (
    <h1 className="text-balance text-center text-[clamp(2.1rem,9.6vw,86px)] font-semibold leading-[1.04] tracking-tight sm:text-6xl md:text-7xl lg:text-[86px]">
      <span className="inline-block whitespace-nowrap text-[#e8eefc]">{renderWord(word1, 0, "")}</span>
      <br />
      <span className="inline-block whitespace-nowrap bg-gradient-to-r from-[#7c5cff] via-[#22d3ee] to-[#34d399] bg-clip-text text-transparent [filter:drop-shadow(0_0_28px_rgba(124,92,255,0.35))]">
        {renderWord(word2, word1.length + 1, "")}
      </span>
    </h1>
  );
}

export default function Hero() {
  const accent = useLabStore((s) => s.heroAccent);
  const setAccent = useLabStore((s) => s.setHeroAccent);
  const setPaletteOpen = useLabStore((s) => s.setPaletteOpen);
  const reduced = useReducedMotion();

  const jump = (key: AccentKey) => {
    setAccent(key);
    scrollToSection(key === "docker" ? "containers" : key);
  };

  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* floating code fragments */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
        {FRAGMENTS.map((f, i) => (
          <span
            key={i}
            className={`drift-frag absolute font-mono text-[11px] text-[#8fa2c9]/50 ${f.blur}`}
            style={{ top: f.top, left: f.left, animationDelay: f.delay }}
          >
            {f.text}
          </span>
        ))}
      </div>

      {/* 3D rack */}
      <div className="absolute inset-0 z-0">
        <SceneShell
          label="3D server rack with pulsing LEDs"
          poster={<RackPoster />}
          render={(frameloop) => (
            <ServerRack accent={accent} reduced={!!reduced} frameloop={frameloop} />
          )}
        />
      </div>

      {/* readability overlay behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 62% 52% at 50% 52%, rgba(5,7,15,0.72) 0%, rgba(5,7,15,0.35) 55%, transparent 78%)",
        }}
      />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#8fa2c9]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#7c5cff] shadow-[0_0_12px_rgba(124,92,255,0.9)]" />
          clu / case-study lab
        </div>
        <button
          onClick={() => setPaletteOpen(true)}
          data-cursor="open"
          data-cursor-label="search"
          aria-label="Open command palette (Control or Command K)"
          className="glass flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[11px] text-[#8fa2c9] transition-colors hover:text-[#e8eefc]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">search commands</span>
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px]">
            <Command className="mr-0.5 inline h-3 w-3" />K
          </kbd>
        </button>
      </header>

      {/* center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-[#8fa2c9] backdrop-blur"
        >
          LVM · NFS · Containers — three case studies, one lab
        </motion.p>

        <SpringTitle />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.7 }}
          className="mt-6 max-w-xl text-balance text-sm leading-relaxed text-[#8fa2c9] md:text-base"
        >
          An interactive build log: scroll-scrubbed 3D scenes, real commands, verified
          results — from resizable storage pools to a container pipeline that ties it
          all together.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.6 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          {JUMP.map((j) => {
            const a = ACCENTS[j.key];
            return (
              <MagneticButton
                key={j.key}
                accentHex={a.hex}
                onClick={() => jump(j.key)}
                cursorLabel="jump"
                ariaLabel={`Jump to the ${j.label} case study`}
              >
                <span style={{ color: a.hex }}>{j.icon}</span>
                {j.label}
                <span className="hidden text-[11px] text-[#8fa2c9] sm:inline">— {j.desc}</span>
              </MagneticButton>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#8fa2c9]"
        >
          <span className="inline-block h-8 w-px animate-pulse bg-gradient-to-b from-transparent via-[#7c5cff] to-transparent" />
          scroll to run the lab
        </motion.div>
      </div>

      {/* command ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="relative z-10"
      >
        <Ticker />
      </motion.div>
    </section>
  );
}
