"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  HardDrive,
  Network,
  Container,
  Target,
  TerminalSquare,
  Workflow,
  Compass,
  Search,
  Command,
  Check,
  RotateCcw,
  X,
  Terminal,
} from "lucide-react";
import { ROUTES, useLabStore, useProgressStore, topicRoute, type Route } from "@/lib/store";
import { TOPICS } from "@/data/learning";

const TOPIC_ICONS = { harddrive: HardDrive, network: Network, container: Container } as const;

interface NavItem {
  label: string;
  href: Route;
  icon: React.ReactNode;
  num?: string;
  hex?: string;
  isTopic?: boolean;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: ROUTES.home, icon: <LayoutDashboard className="h-4 w-4" /> }],
  },
  {
    title: "Courses",
    items: TOPICS.map((t) => {
      const Icon = TOPIC_ICONS[t.icon];
      return {
        label: t.name,
        href: topicRoute(t.key),
        icon: <Icon className="h-4 w-4" />,
        num: t.num,
        hex: t.accentHex,
        isTopic: true,
      };
    }),
  },
  {
    title: "Practice",
    items: [
      { label: "Challenge Arena", href: ROUTES.practice, icon: <Target className="h-4 w-4" /> },
      { label: "Terminal Lab", href: ROUTES.terminal, icon: <TerminalSquare className="h-4 w-4" /> },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Integration Pipeline", href: ROUTES.pipeline, icon: <Workflow className="h-4 w-4" /> },
      { label: "Resources", href: ROUTES.resources, icon: <Compass className="h-4 w-4" /> },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const setPaletteOpen = useLabStore((s) => s.setPaletteOpen);
  const completed = useProgressStore((s) => s.completed);
  const replayIntro = useLabStore((s) => s.replayIntro);

  const topicKeyOf = (num?: string) =>
    num === "01" ? "lvm" : num === "02" ? "nfs" : num === "03" ? "docker" : undefined;

  return (
    <nav aria-label="Platform navigation" className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href={ROUTES.home}
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 pb-5 pt-6 transition-opacity hover:opacity-85"
        aria-label="Linux Lab home"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#4ade8044] bg-[#4ade8012]">
          <Terminal className="h-4 w-4 text-[#4ade80]" />
        </span>
        <span className="min-w-0">
          <span className="block whitespace-nowrap font-mono text-[13px] font-semibold tracking-[0.18em] text-[#e8eefc]">
            LINUX LAB
          </span>
          <span className="block whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-[#8fa2c9]">
            learn · practise · master
          </span>
        </span>
      </Link>

      {/* Search */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-left font-mono text-[11.5px] text-[#8fa2c9] transition-colors hover:border-white/25 hover:text-[#e8eefc]"
          aria-label="Open command palette (Control or Command K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search commands…</span>
          <kbd className="flex items-center gap-0.5 rounded border border-white/15 px-1.5 py-0.5 text-[9.5px]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="mb-1.5 px-3 font-mono text-[9.5px] uppercase tracking-[0.28em] text-[#64748b]">
              {g.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => {
                const active = pathname === item.href;
                const key = topicKeyOf(item.num);
                const done = item.isTopic && key ? completed.includes(key) : false;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
                        active
                          ? "bg-white/8 text-[#e8eefc]"
                          : "text-[#8fa2c9] hover:bg-white/4 hover:text-[#e8eefc]"
                      }`}
                    >
                      {/* active rail */}
                      {active && (
                        <motion.span
                          layoutId="side-rail"
                          className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-[#4ade80]"
                          style={{ boxShadow: "0 0 10px rgba(74,222,128,0.7)" }}
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={
                          item.hex
                            ? { color: item.hex, background: `${item.hex}14`, border: `1px solid ${item.hex}33` }
                            : { color: active ? "#e8eefc" : "#8fa2c9" }
                        }
                      >
                        {item.icon}
                      </span>
                      {item.num && (
                        <span className="font-mono text-[9.5px] text-[#64748b]">{item.num}</span>
                      )}
                      <span className={`flex-1 truncate ${item.num ? "font-mono text-[12.5px]" : ""}`}>
                        {item.label}
                      </span>
                      {done && <Check className="h-3.5 w-3.5 shrink-0 text-[#34d399]" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer: chapter progress + replay intro */}
      <div className="border-t border-white/8 px-5 py-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#64748b]">
          chapters complete — {completed.length}/3
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] via-[#22d3ee] to-[#34d399] transition-all duration-700"
            style={{ width: `${(completed.length / 3) * 100}%`, boxShadow: "0 0 12px rgba(74,222,128,0.4)" }}
          />
        </div>
        <button
          onClick={replayIntro}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 font-mono text-[10.5px] text-[#8fa2c9] transition-colors hover:border-[#4ade8066] hover:text-[#4ade80]"
        >
          <RotateCcw className="h-3 w-3" />
          replay boot intro
        </button>
      </div>
    </nav>
  );
}

/** Learning-platform shell: fixed sidebar on desktop, slide-over on mobile. */
export default function Sidebar() {
  const open = useLabStore((s) => s.sidebarOpen);
  const setOpen = useLabStore((s) => s.setSidebarOpen);
  const pathname = usePathname();

  // Route change closes the mobile drawer.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <>
      {/* Desktop rail */}
      <aside
        aria-label="Sidebar"
        className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/8 bg-[#070a14]/85 backdrop-blur-xl lg:block"
      >
        <NavList />
      </aside>

      {/* Mobile slide-over */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-[61] flex w-[280px] flex-col border-r border-white/10 bg-[#070a14] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 z-10 rounded-lg border border-white/10 p-1.5 text-[#8fa2c9] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <NavList onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
