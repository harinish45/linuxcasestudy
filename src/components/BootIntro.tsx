"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, SkipForward } from "lucide-react";
import { useLabStore } from "@/lib/store";

const SESSION_KEY = "clu-boot-v1";

interface BootLine {
  text: string;
  cls: "bios" | "cmd" | "out" | "ok" | "grant";
  /** ms pause after the line completes */
  hold?: number;
  /** type per-character (false = instant print) */
  type?: boolean;
}

const BOOT_SCRIPT: BootLine[] = [
  { text: "COMPREHENSIVE LINUX BIOS — v3.7.1", cls: "bios", hold: 220, type: false },
  { text: "MEM CHECK ..................... 65536K OK", cls: "bios", hold: 120, type: false },
  { text: "CPU CORES ..................... 8 ONLINE", cls: "bios", hold: 120, type: false },
  { text: "LOADING /boot/vmlinuz-lab ..... OK", cls: "bios", hold: 260, type: false },
  { text: "mounting /dev/curiosity ....... OK", cls: "bios", hold: 340, type: false },
  { text: "root@lab:~# whoami", cls: "cmd", hold: 200 },
  { text: "root", cls: "out", hold: 220 },
  { text: "root@lab:~# cat /etc/motd", cls: "cmd", hold: 200 },
  { text: '"Those who understand the stack own the stack."', cls: "out", hold: 340 },
  { text: "root@lab:~# ./improve_pc --mode=calm", cls: "cmd", hold: 300 },
  { text: "[1/6] kernel modules .......... lvm.ko  nfs.ko  overlay2.ko", cls: "ok", hold: 200, type: false },
  { text: "[2/6] warming terminal ........ 40+ commands staged", cls: "ok", hold: 200, type: false },
  { text: "[3/6] cueing lessons .......... 3 chapters found", cls: "ok", hold: 200, type: false },
  { text: "[4/6] arming practice arena ... 15 challenges ready", cls: "ok", hold: 200, type: false },
  { text: "[5/6] calibrating sparks ...... cursor online", cls: "ok", hold: 200, type: false },
  { text: "[6/6] brain overclock ......... 4.2 GHz", cls: "ok", hold: 380, type: false },
  { text: "ACCESS GRANTED — welcome to the lab", cls: "grant", hold: 120, type: false },
];

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const LINE_CLS: Record<BootLine["cls"], string> = {
  bios: "text-[#8f8b80]",
  cmd: "text-[#e08c6d]",
  out: "text-[#c9c5ba]",
  ok: "text-[#a7b98a]",
  grant: "text-[#e08c6d] font-semibold",
};

/**
 * Boot intro — a warm charcoal terminal types itself, then invites you in.
 * Plays once per browser session, skippable with any key or click,
 * replayable from the sidebar / footer.
 */
export default function BootIntro() {
  const setIntroDone = useLabStore((s) => s.setIntroDone);
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<{ text: string; cls: BootLine["cls"] }[]>([]);
  const [partial, setPartial] = useState("");
  const [phase, setPhase] = useState<"boot" | "ready" | "leaving">("boot");
  const token = useRef(0);
  const leavingRef = useRef(false);

  // Seen it already this session? dismiss instantly.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) setIntroDone(true);
    } catch {
      /* private mode — play it */
    }
  }, [setIntroDone]);

  const finish = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setPhase("leaving");
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setIntroDone(true), 450);
  };

  const skipTyping = () => {
    token.current += 1;
    setPartial("");
    setLines(BOOT_SCRIPT.map((l) => ({ text: l.text, cls: l.cls })));
    setPhase("ready");
  };

  // Type the script (cancelled by skip / unmount).
  useEffect(() => {
    if (reduced) {
      // Defer so we never setState synchronously inside the effect body.
      const t = window.setTimeout(() => skipTyping(), 0);
      return () => window.clearTimeout(t);
    }
    const my = ++token.current;
    let cancelled = false;
    (async () => {
      for (const line of BOOT_SCRIPT) {
        if (cancelled || token.current !== my) return;
        if (line.type === false) {
          setLines((p) => [...p, { text: line.text, cls: line.cls }]);
        } else {
          for (let i = 1; i <= line.text.length; i++) {
            if (cancelled || token.current !== my) return;
            setPartial(line.text.slice(0, i));
            await sleep(line.cls === "cmd" ? 24 : 12);
          }
          if (cancelled || token.current !== my) return;
          setPartial("");
          setLines((p) => [...p, { text: line.text, cls: line.cls }]);
        }
        await sleep(line.hold ?? 80);
      }
      if (!cancelled && token.current === my) setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  // Any key skips typing; Enter/Escape/Space from "ready" enters the lab.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "boot") {
        skipTyping();
      } else if (["Enter", " ", "Escape"].includes(e.key)) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const showCta = phase !== "boot";

  return (
    <motion.div
      data-testid="boot-intro"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "leaving" ? 0 : 1 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-[#1c1b18]"
      onClick={() => phase === "boot" && skipTyping()}
      role="dialog"
      aria-label="Boot intro"
    >
      {/* faint static grain + warm vignette */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(12,11,9,0.6) 100%)",
        }}
      />

      <div className="relative z-10 w-[min(94vw,760px)] px-4">
        {/* Terminal window */}
        <div className="relative overflow-hidden rounded-xl border border-[#3a3833] bg-[#262421] shadow-[0_24px_80px_rgba(10,9,7,0.5)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-[#3a3833] bg-[#2b2926] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c6613f]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#b08968]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#788c5d]/70" />
            <span className="ml-3 font-mono text-[11px] tracking-wider text-[#8f8b80]">
              root@lab — improve_pc — 80×24
            </span>
            <button
              onClick={finish}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[#4a463f] px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[#8f8b80] transition-colors hover:border-[#e08c6d66] hover:text-[#e08c6d]"
              aria-label="Skip intro"
            >
              <SkipForward className="h-3 w-3" />
              skip
            </button>
          </div>

          {/* Output */}
          <div
            className="scanlines relative h-[46vh] min-h-[300px] overflow-hidden px-5 py-4 font-mono text-[12.5px] leading-[1.7] sm:text-[13px]"
            aria-live="polite"
          >
            {lines.map((l, i) => (
              <p key={i} className={LINE_CLS[l.cls]}>
                {l.text}
              </p>
            ))}
            {phase === "boot" && (
              <p className="text-[#edeae2]">
                {partial}
                <span className="caret-boot" aria-hidden />
              </p>
            )}
            {showCta && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mt-6 flex flex-wrap items-center gap-4"
              >
                <button
                  onClick={finish}
                  autoFocus
                  className="group inline-flex items-center gap-2 rounded-lg bg-[#d97757] px-5 py-2.5 font-mono text-[13px] font-medium tracking-wide text-white transition-all duration-200 hover:bg-[#c6613f]"
                >
                  enter the lab
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                <span className="font-mono text-[11px] text-[#6e6a61]">or press Enter ↵</span>
              </motion.div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.3em] text-[#6e6a61]">
          learn lvm · nfs · containers — the calm way
        </p>
      </div>
    </motion.div>
  );
}
