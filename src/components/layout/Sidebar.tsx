"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  HardDrive,
  Network,
  Container,
  Target,
  TerminalSquare,
  Workflow,
  Compass,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { ROUTES, useLabStore, useProgressStore, topicRoute, type Route } from "@/lib/store";
import { TOPICS } from "@/data/learning";
import { LogoMark } from "@/components/Logo";

const TOPIC_ICONS = { harddrive: HardDrive, network: Network, container: Container } as const;

interface NavItem {
  label: string;
  href: Route;
  icon: React.ReactNode;
  num?: string;
  accentHex?: string;
  isTopic?: boolean;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: ROUTES.home, icon: <LayoutDashboard className="h-4 w-4" /> }],
  },
  {
    title: "My Courses",
    items: TOPICS.map((t) => {
      const Icon = TOPIC_ICONS[t.icon];
      return {
        label: t.name,
        href: topicRoute(t.key),
        icon: <Icon className="h-4 w-4" />,
        num: t.num,
        accentHex: t.accentHex,
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
        className="flex items-center gap-2.5 px-5 pb-6 pt-6 transition-opacity hover:opacity-80"
        aria-label="Linux Lab home"
      >
        <LogoMark size={32} />
        <span className="min-w-0">
          <span className="display block whitespace-nowrap text-[16.5px] leading-tight text-foreground">
            Linux Lab
          </span>
          <span className="block whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-text-faint">
            learn · practise · master
          </span>
        </span>
      </Link>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="mb-1.5 px-3 font-mono text-[9.5px] uppercase tracking-[0.24em] text-text-faint">
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
                      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] transition-colors duration-150 ${
                        active
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-card hover:text-foreground"
                      }`}
                    >
                      {/* active rail */}
                      {active && (
                        <motion.span
                          layoutId="side-rail"
                          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        />
                      )}
                      <span
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md"
                        style={
                          item.accentHex
                            ? { color: item.accentHex, background: `${item.accentHex}14` }
                            : { color: active ? "var(--terracotta)" : "var(--muted-foreground)" }
                        }
                      >
                        {item.icon}
                      </span>
                      {item.num && (
                        <span className="font-mono text-[9.5px] text-text-faint">{item.num}</span>
                      )}
                      <span className="flex-1 truncate">{item.label}</span>
                      {done && <Check className="h-3.5 w-3.5 shrink-0 text-sage" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer: chapter progress + replay intro */}
      <div className="px-5 pb-3 pt-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-text-faint">
            chapters
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">{completed.length}/3</p>
        </div>
        <div className="progress-track mt-2">
          <div
            className="progress-fill progress-fill-sage"
            style={{ width: `${(completed.length / 3) * 100}%` }}
          />
        </div>
        <button
          onClick={replayIntro}
          className="btn-ghost mt-3 w-full justify-center !px-2.5 !py-1.5 font-mono !text-[10.5px]"
        >
          <RotateCcw className="h-3 w-3" />
          replay boot intro
        </button>
      </div>

      {/* Profile */}
      <div className="border-t border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-[13px] text-text-secondary">
            G
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">Guest learner</p>
            <p className="truncate font-mono text-[9.5px] text-text-faint">local progress · no account</p>
          </div>
        </div>
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
        className="fixed inset-y-0 left-0 z-40 hidden w-[252px] border-r border-border bg-secondary/60 lg:block"
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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-foreground/25 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-[61] flex w-[272px] flex-col border-r border-border bg-background lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 z-10 rounded-lg border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:text-foreground"
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
