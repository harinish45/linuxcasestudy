"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Server, MonitorDot, ShieldCheck, ShieldAlert, Zap, Lock, Check } from "lucide-react";

const V = "#22d3ee";
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const CLIENTS = ["web-1", "web-2", "backup"];

/**
 * NFS interactive diagram: one server exporting, three clients mounting.
 * Toggles: sync/async write mode · root_squash security · firewall (2049).
 */
export default function NfsVisual() {
  const reduced = useReducedMotion();
  const [sync, setSync] = useState(true);
  const [squash, setSquash] = useState(true);
  const [firewall, setFirewall] = useState(true);
  const [packets, setPackets] = useState<{ id: number; client: number; ack: boolean }[]>([]);
  const [writes, setWrites] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const seq = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // packet loop — only when firewall open
  useEffect(() => {
    if (reduced) return;
    const interval = window.setInterval(() => {
      if (!alive.current) return;
      if (!firewall) {
        setBlocked(true);
        return;
      }
      setBlocked(false);
      const client = Math.floor(Math.random() * 3);
      const id = ++seq.current;
      setPackets((p) => [...p.slice(-8), { id, client, ack: sync }]);
      if (sync) {
        window.setTimeout(() => setWrites((w) => w + 1), 1400);
      } else {
        setWrites((w) => w + 1);
      }
      window.setTimeout(() => {
        if (alive.current) setPackets((p) => p.filter((q) => q.id !== id));
      }, 1800);
    }, sync ? 1100 : 650);
    return () => window.clearInterval(interval);
  }, [sync, firewall, reduced]);

  return (
    <div className="flex flex-col gap-5">
      {/* toggles */}
      <div className="flex flex-wrap gap-2">
        <ToggleBtn
          active={sync}
          onClick={() => setSync((s) => !s)}
          label={sync ? "sync — ack after disk write" : "async — ack immediately"}
          icon={<Zap className="h-3.5 w-3.5" />}
          color={V}
        />
        <ToggleBtn
          active={squash}
          onClick={() => setSquash((s) => !s)}
          label={squash ? "root_squash ON" : "no_root_squash ⚠"}
          icon={squash ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          color={squash ? V : "#f87171"}
        />
        <ToggleBtn
          active={firewall}
          onClick={() => setFirewall((f) => !f)}
          label={firewall ? "ufw : 2049/tcp open" : "ufw : 2049 blocked"}
          icon={<Lock className="h-3.5 w-3.5" />}
          color={firewall ? V : "#f87171"}
        />
      </div>

      {/* diagram */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* server */}
        <div className="rounded-xl border p-4" style={{ borderColor: `${V}44`, background: `${V}0d` }}>
          <p className="flex items-center gap-2 font-mono text-xs font-medium text-[#e8eefc]">
            <Server className="h-4 w-4" style={{ color: V }} /> nfs-server
          </p>
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-[#8fa2c9]">
            /srv/nfs/shared
            <br />
            <span style={{ color: squash ? "#86efac" : "#f87171" }}>
              192.168.56.0/24(rw,{sync ? "sync" : "async"},{squash ? "root_squash" : "no_root_squash"})
            </span>
          </p>
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-[#05070f]/70 px-2.5 py-1.5 font-mono text-[10px]">
            <span className="text-[#8fa2c9]">ack&apos;d writes</span>
            <motion.span key={writes} initial={reduced ? {} : { scale: 1.3 }} animate={{ scale: 1 }} style={{ color: V }}>
              {writes}
            </motion.span>
          </div>
        </div>

        {/* wire */}
        <svg width="120" height="190" viewBox="0 0 120 190" fill="none" className="shrink-0" aria-hidden>
          {CLIENTS.map((_, i) => {
            const y = 30 + i * 62;
            return <path key={i} d={`M8 95 C 45 95, 45 ${y}, 112 ${y}`} stroke={`${V}33`} strokeWidth="1.5" strokeDasharray="4 4" />;
          })}
          <AnimatePresence>
            {blocked && (
              <motion.text
                key="blocked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                x="60"
                y="99"
                textAnchor="middle"
                fill="#f87171"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                ✕ blocked
              </motion.text>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {packets.map((p) => {
              const y = 30 + p.client * 62;
              const midY = 47.5 + 0.5 * y; // bezier midpoint approximation
              return (
                <motion.circle
                  key={p.id}
                  r="4.5"
                  fill={V}
                  initial={{ cx: 8, cy: 95, opacity: 0.95 }}
                  animate={{ cx: [8, 48.75, 112], cy: [95, midY, y], opacity: 0.95 }}
                  transition={{ duration: sync ? 1.3 : 0.7, ease: "linear", times: [0, 0.5, 1] }}
                  exit={{ opacity: 0 }}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* clients */}
        <div className="flex flex-col gap-2.5">
          {CLIENTS.map((c, i) => {
            const hasPacket = packets.some((p) => p.client === i);
            return (
              <div key={c} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2">
                <MonitorDot className="h-3.5 w-3.5" style={{ color: V }} />
                <span className="font-mono text-[11px] text-[#e8eefc]">{c}</span>
                <span className="font-mono text-[9px] text-[#64748b]">/mnt/shared</span>
                <AnimatePresence>
                  {hasPacket && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-auto"
                    >
                      <Check className="h-3.5 w-3.5" style={{ color: sync ? V : "#f87171" }} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* security consequence strip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={squash ? "safe" : "unsafe"}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          className="rounded-lg border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed"
          style={{
            borderColor: squash ? `${V}44` : "#f8717155",
            background: squash ? `${V}0d` : "#f8717114",
            color: squash ? "#b9c6e4" : "#fca5a5",
          }}
        >
          {squash
            ? "root_squash ON → client root is mapped to 'nobody'. A compromised client can't own the share. Safe default."
            : "no_root_squash → client root keeps UID 0 on your share. Lab shortcut — production landmine. One compromised client owns every file."}
        </motion.div>
      </AnimatePresence>

      {/* command echo */}
      <div className="rounded-lg border border-white/10 bg-[#05070f]/80 px-3.5 py-2.5 font-mono text-[12px]" aria-live="polite">
        <span style={{ color: V }}>$ </span>
        <span className="text-[#e8eefc]">
          {firewall
            ? "sudo ufw allow from 192.168.56.0/24 to any port 2049 proto tcp"
            : "mount.nfs: connection timed out — is 2049/tcp open?"}
        </span>
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  icon,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-[11px] transition-all duration-300"
      style={{
        borderColor: active ? `${color}66` : "rgba(255,255,255,0.12)",
        background: active ? `${color}14` : "transparent",
        color: active ? "#e8eefc" : "#8fa2c9",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
