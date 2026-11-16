"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, SkipForward } from "lucide-react";
import { useLabStore } from "@/lib/store";

const SESSION_KEY = "clu-boot-v1";
const GREEN = "#4ade80";

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
  { text: 'root@lab:~# cat /etc/motd', cls: "cmd", hold: 200 },
  { text: '"Those who understand the stack own the stack."', cls: "out", hold: 340 },
  { text: "root@lab:~# ./improve_pc --mode=hacker", cls: "cmd", hold: 300 },
  { text: "[1/6] kernel modules .......... lvm.ko  nfs.ko  overlay2.ko", cls: "ok", hold: 200, type: false },
  { text: "[2/6] warming terminal ........ 40+ commands staged", cls: "ok", hold: 200, type: false },
  { text: "[3/6] cueing lessons .......... 3 chapters found", cls: "ok", hold: 200, type: false },
  { text: "[4/6] arming practice arena ... 15 challenges ready", cls: "ok", hold: 200, type: false },
  { text: "[5/6] calibrating sparks ...... cursor online", cls: "ok", hold: 200, type: false },
  { text: "[6/6] brain overclock ......... 4.2 GHz", cls: "ok", hold: 380, type: false },
  { text: "ACCESS GRANTED — welcome to the lab", cls: "grant", hold: 120, type: false },
];

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Full-screen matrix rain behind the boot terminal. */
function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GLYPHS = "アイウエオカキクケコサシスセソｱｲｳｴｵ01<>[]{}/\\$#%&*".split("");
    let cols = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      cols = Math.ceil(canvas.width / (14 * dpr));
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -60));
      ctx.font = `${13 * dpr}px "JetBrains Mono", monospace`;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 66) return; // ~15fps
      last = now;
      ctx.fillStyle = "rgba(2, 4, 9, 0.10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cols; i++) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * 14 * dpr;
        const y = drops[i] * 16 * dpr;
        ctx.fillStyle = Math.random() < 0.02 ? "rgba(232,238,252,0.9)" : "rgba(74, 222, 128, 0.85)";
        ctx.fillText(glyph, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = Math.floor(Math.random() * -40);
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full opacity-25" />;
}

const LINE_CLS: Record<BootLine["cls"], string> = {
  bios: "text-[#8fa2c9]",
  cmd: "text-[#4ade80]",
  out: "text-[#b9c6e4]",
  ok: "text-[#86efac]",
  grant: "text-[#4ade80] font-semibold",
};

/**
 * Hacker boot intro: BIOS lines → typed green "hacker" commands → ACCESS GRANTED.
 * Plays once per browser session, skippable with any key or click, replayable from the footer.
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
    window.setTimeout(() => setIntroDone(true), 650);
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
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-[#020409]"
      onClick={() => phase === "boot" && skipTyping()}
      role="dialog"
      aria-label="Hacker boot intro"
    >
      <MatrixRain />
      <div className="crt-vignette" aria-hidden />

      <div className="relative z-10 w-[min(94vw,760px)] px-4">
        {/* Terminal window */}
        <div className="scanlines relative overflow-hidden rounded-xl border border-[#4ade8033] bg-[#020409f2] shadow-[0_0_80px_rgba(74,222,128,0.12),0_24px_80px_rgba(0,0,0,0.6)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-white/8 bg-white/4 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[11px] tracking-wider text-[#8fa2c9]">
              root@lab — improve_pc — 80×24
            </span>
            <button
              onClick={finish}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[#8fa2c9] transition-colors hover:border-[#4ade8066] hover:text-[#4ade80]"
              aria-label="Skip intro"
            >
              <SkipForward className="h-3 w-3" />
              skip
            </button>
          </div>

          {/* Output */}
          <div
            className="h-[46vh] min-h-[300px] overflow-hidden px-5 py-4 font-mono text-[12.5px] leading-[1.7] sm:text-[13px]"
            aria-live="polite"
          >
            {lines.map((l, i) => (
              <p key={i} className={LINE_CLS[l.cls]}>
                {l.text}
              </p>
            ))}
            {phase === "boot" && (
              <p className="text-[#4ade80]">
                {partial}
                <span className="caret-green" aria-hidden />
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
                  className="group inline-flex items-center gap-2 rounded-lg border border-[#4ade8066] bg-[#4ade8014] px-5 py-2.5 font-mono text-[13px] font-medium tracking-wide text-[#4ade80] transition-all duration-300 hover:bg-[#4ade8026] hover:shadow-[0_0_28px_rgba(74,222,128,0.35)]"
                >
                  enter the lab
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <span className="font-mono text-[11px] text-[#64748b]">or press Enter ↵</span>
              </motion.div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.3em] text-[#4ade8080]">
          learn lvm · nfs · containers — the hacker way
        </p>
      </div>
    </motion.div>
  );
}
