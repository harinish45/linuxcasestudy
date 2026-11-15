"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FolderGit2, AlertTriangle, ShieldCheck, TerminalSquare, Unplug } from "lucide-react";
import SceneShell from "@/components/three/SceneShell";
import { NfsPoster } from "@/components/three/fallbacks";
import CaseContent from "@/components/CaseContent";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/providers/ToastProvider";
import { NFS_META, NFS_STEPS, NFS_TROUBLESHOOTING, NFS_VERIFICATION } from "@/data/nfs";

const NfsScene = dynamic(() => import("@/components/three/NfsScene"), { ssr: false });

const CYAN = "#22d3ee";

function LabToggle({
  on,
  onToggle,
  label,
  sub,
  accentHex,
  cursorLabel = "toggle",
  ariaLabel,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  sub?: string;
  accentHex: string;
  cursorLabel?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel ?? label}
      onClick={onToggle}
      data-cursor="toggle"
      data-cursor-label={cursorLabel}
      className="glass flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/8"
    >
      <span
        className="relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors duration-300"
        style={{ background: on ? `${accentHex}80` : "rgba(255,255,255,0.12)", boxShadow: on ? `0 0 14px ${accentHex}55` : undefined }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 550, damping: 32 }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
          style={{ left: on ? 18 : 2 }}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-[12px] text-[#e8eefc]">{label}</span>
        {sub && <span className="block truncate text-[10.5px] text-[#8fa2c9]">{sub}</span>}
      </span>
    </button>
  );
}

/** Small typed-output terminal used by the "mount" demo. */
function MountTerminal({ runKey }: { runKey: number }) {
  const [lines, setLines] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const cmd = "sudo mount -t nfs -o rw,sync 192.168.56.10:/srv/nfs/shared /mnt/shared";
  const outputs = [
    "# mount.nfs4: negotiating NFSv4 with 192.168.56.10 …",
    "# rpc: tcp/2049 open · sec=sys",
    "mounted → 192.168.56.10:/srv/nfs/shared on /mnt/shared",
    "df -h → 192.168.56.10:/srv/nfs/shared  7.0G  2.3G  4.8G  33% /mnt/shared",
  ];

  useEffect(() => {
    if (!runKey) return;
    let cancelled = false;
    let i = 0;
    const timers: number[] = [];
    const begin = () => {
      if (cancelled) return;
      setLines([]);
      setTyped("");
      typeCmd();
    };
    const typeCmd = () => {
      if (cancelled) return;
      if (i < cmd.length) {
        setTyped(cmd.slice(0, i + 1));
        i += 1;
        timers.push(window.setTimeout(typeCmd, 35));
      } else {
        outputs.forEach((line, k) => {
          timers.push(window.setTimeout(() => !cancelled && setLines((p) => [...p, line]), 300 + k * 120));
        });
      }
    };
    timers.push(window.setTimeout(begin, 250));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [runKey]);

  return (
    <div className="scanlines relative rounded-xl border border-white/10 bg-[#05070f]/80 p-4 font-mono text-[12px] leading-relaxed">
      <p className="text-[#e8eefc]">
        <span style={{ color: CYAN }}>$ </span>
        {typed}
        <span className="term-cursor" />
      </p>
      {lines.map((l, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className={l.startsWith("#") ? "text-[#8fa2c9]" : "border-l-2 pl-2 text-[#a7f3d0]"}
          style={l.startsWith("#") ? undefined : { borderColor: "#34d399" }}
        >
          {l}
        </motion.p>
      ))}
    </div>
  );
}

function PermissionsDiagram() {
  const perm = "rwxr-sr-x";
  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: CYAN }}>
        permissions · the sharing glue
      </p>
      <p className="mb-4 text-[12.5px] leading-relaxed text-[#8fa2c9]">
        The export directory is <span className="font-mono text-[#e8eefc]">chmod 2775</span>. Hover the{" "}
        <span className="font-mono text-[#e8eefc]">s</span> — the setgid bit is what keeps group ownership
        consistent across every client.
      </p>
      <div className="flex items-end gap-1 font-mono text-3xl md:text-4xl">
        {perm.split("").map((ch, i) => {
          const isSetgid = ch === "s";
          return (
            <span key={i} className="group relative">
              <span
                className={isSetgid ? "cursor-help text-[#34d399] [text-shadow:0_0_18px_rgba(52,211,153,0.7)]" : "text-[#e8eefc]"}
                tabIndex={isSetgid ? 0 : -1}
                aria-describedby={isSetgid ? "setgid-tip" : undefined}
              >
                {ch}
              </span>
              {isSetgid && (
                <span
                  id="setgid-tip"
                  role="tooltip"
                  className="glass-strong pointer-events-none absolute -top-2 left-1/2 z-20 w-64 -translate-x-1/2 -translate-y-full rounded-xl p-3 text-[11.5px] leading-relaxed text-[#b9c6e4] opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#34d399]">
                    setgid bit (2 in 2775)
                  </span>
                  Every file created inside inherits the directory&apos;s group —
                  <span className="font-mono text-[#e8eefc]"> nfs-shared </span>
                  — so writes from any client stay collaboratively owned. No shared passwords, no chown wars.
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex gap-8 font-mono text-[10px] uppercase tracking-widest text-[#8fa2c9]">
        <span>user</span>
        <span className="ml-10">group</span>
        <span className="ml-8">other</span>
      </div>
    </div>
  );
}

export default function CaseNFS() {
  const { push } = useToast();
  const [sync, setSync] = useState(true);
  const [squash, setSquash] = useState(true);
  const [firewall, setFirewall] = useState(true); // true = port open
  const [mounted, setMounted] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const onMount = () => {
    if (mounted) {
      setMounted(false);
      push({ title: "umount /mnt/shared", description: "Client detached from the export.", tone: "info" });
      return;
    }
    if (!firewall) {
      push({ title: "mount failed", description: "TCP/2049 is blocked — open the firewall first.", tone: "error" });
      return;
    }
    setMounted(true);
    setRunKey((k) => k + 1);
    push({ title: "Cable drawn", description: "client-2 docked to n10 over NFSv4.", tone: "success" });
  };

  return (
    <section id="nfs" className="relative pt-10">
      <CaseContent
        meta={NFS_META}
        steps={NFS_STEPS}
        verification={NFS_VERIFICATION}
        troubleshooting={NFS_TROUBLESHOOTING}
        accentHex={CYAN}
        extra={
          <div className="mb-14">
            {/* ── 3D stage ── */}
            <div className="glass relative mb-4 h-[430px] overflow-hidden rounded-2xl md:h-[540px]">
              <SceneShell
                label="NFS scene: a central export server with three orbiting clients receiving data packets"
                poster={<NfsPoster />}
                render={(frameloop) => (
                  <NfsScene
                    frameloop={frameloop}
                    sync={sync}
                    squash={squash}
                    firewall={firewall}
                    mounted={mounted}
                    reduced={false}
                  />
                )}
              />
              {/* status badges */}
              <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10.5px] backdrop-blur ${
                    sync
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {sync ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {sync ? "sync · safe" : "async · data loss risk"}
                </span>
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10.5px] backdrop-blur ${
                    squash
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-red-400/40 bg-red-400/10 text-red-300"
                  }`}
                >
                  {squash ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {squash ? "root_squash · PASS" : "SECURITY ALERT"}
                </span>
                {!firewall && (
                  <span className="flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 font-mono text-[10.5px] text-red-300 backdrop-blur">
                    <Unplug className="h-3 w-3" /> 2049 blocked · timed out
                  </span>
                )}
                {mounted && (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#22d3ee44] bg-[#22d3ee14] px-3 py-1 font-mono text-[10.5px] text-[#22d3ee] backdrop-blur">
                    <FolderGit2 className="h-3 w-3" /> /mnt/shared mounted
                  </span>
                )}
              </div>
            </div>

            {/* ── controls ── */}
            <div className="glass-strong mb-4 flex flex-col gap-3 rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <LabToggle
                  on={sync}
                  onToggle={() => setSync((v) => !v)}
                  label={sync ? "sync" : "async"}
                  sub="commit writes before ACK vs buffer server-side"
                  accentHex={sync ? "#34d399" : "#f59e0b"}
                  ariaLabel="Toggle synchronous writes"
                />
                <LabToggle
                  on={squash}
                  onToggle={() => setSquash((v) => !v)}
                  label="root_squash"
                  sub="map remote root → nobody (65534)"
                  accentHex={CYAN}
                  ariaLabel="Toggle root squashing"
                />
                <LabToggle
                  on={firewall}
                  onToggle={() => setFirewall((v) => !v)}
                  label={firewall ? "tcp/2049 open" : "tcp/2049 blocked"}
                  sub="ufw rule for the NFSv4 port"
                  accentHex={firewall ? CYAN : "#f87171"}
                  cursorLabel="firewall"
                  ariaLabel="Toggle firewall port 2049"
                />
                <MagneticButton onClick={onMount} accentHex={mounted ? undefined : CYAN} cursorLabel={mounted ? "unmount" : "mount"} className="!px-4 !py-3 text-[12.5px] sm:flex-none">
                  <TerminalSquare className="h-4 w-4" style={{ color: CYAN }} />
                  {mounted ? "Unmount client" : "Mount from client-2"}
                </MagneticButton>
              </div>
              <AnimatePresence>
                {mounted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <MountTerminal runKey={runKey} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <PermissionsDiagram />
          </div>
        }
      />
    </section>
  );
}
