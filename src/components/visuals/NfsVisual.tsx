"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Server, MonitorDot, ShieldCheck, ShieldAlert, Zap, Lock, Check } from "lucide-react";

const V = "#6a9bcc";
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const CLIENTS = ["web-1", "web-2", "backup"];
/** X positions of the three client taps in the fan-out svg. */
const CLIENT_X = [60, 180, 300];

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
          color={squash ? V : "#b3391b"}
        />
        <ToggleBtn
          active={firewall}
          onClick={() => setFirewall((f) => !f)}
          label={firewall ? "ufw : 2049/tcp open" : "ufw : 2049 blocked"}
          icon={<Lock className="h-3.5 w-3.5" />}
          color={firewall ? V : "#b3391b"}
        />
      </div>

      {/* diagram — vertical fan-out: server on top, clients below (fits any width) */}
      <div>
        {/* server */}
        <div className="rounded-xl border p-4" style={{ borderColor: `${V}44`, background: `${V}0d` }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-mono text-xs font-medium text-foreground">
              <Server className="h-4 w-4" style={{ color: V }} /> nfs-server
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-1.5 font-mono text-[10px]">
              <span className="text-muted-foreground">ack&apos;d writes</span>
              <motion.span
                key={writes}
                initial={reduced ? {} : { scale: 1.25 }}
                animate={{ scale: 1 }}
                style={{ color: V }}
              >
                {writes}
              </motion.span>
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
            /srv/nfs/shared ·{" "}
            <span style={{ color: squash ? "var(--sage)" : "#b3391b" }}>
              192.168.56.0/24 (rw, {sync ? "sync" : "async"}, {squash ? "root_squash" : "no_root_squash"})
            </span>
          </p>
        </div>

        {/* wire fan */}
        <svg viewBox="0 0 360 56" fill="none" className="my-1 h-14 w-full" aria-hidden>
          {CLIENT_X.map((x, i) => {
            return (
              <path key={i} d={`M180 2 C 180 26, ${x} 26, ${x} 54`} stroke={`${V}44`} strokeWidth="1.5" strokeDasharray="4 4" />
            );
          })}
          <AnimatePresence>
            {blocked && (
              <motion.text
                key="blocked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                x="180"
                y="30"
                textAnchor="middle"
                fill="#b3391b"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                ✕ blocked
              </motion.text>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {packets.map((p) => {
              const x = CLIENT_X[p.client];
              return (
                <motion.circle
                  key={p.id}
                  r="4.5"
                  fill={V}
                  initial={{ cx: 180, cy: 2, opacity: 0.95 }}
                  animate={{ cx: [180, x, x], cy: [2, 28, 54], opacity: 0.95 }}
                  transition={{ duration: sync ? 1.3 : 0.7, ease: "linear", times: [0, 0.5, 1] }}
                  exit={{ opacity: 0 }}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* clients */}
        <div className="flex flex-col gap-2">
          {CLIENTS.map((c, i) => {
            const hasPacket = packets.some((p) => p.client === i);
            return (
              <div key={c} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <MonitorDot className="h-3.5 w-3.5 shrink-0" style={{ color: V }} />
                <span className="font-mono text-[11px] text-foreground">{c}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[9px] text-text-faint">/mnt/shared</span>
                <AnimatePresence>
                  {hasPacket && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Check className="h-3.5 w-3.5" style={{ color: sync ? V : "#b3391b" }} />
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
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed"
          style={{
            borderColor: squash ? `${V}44` : "rgba(179,57,27,0.35)",
            background: squash ? `${V}0d` : "rgba(179,57,27,0.06)",
            color: squash ? "var(--text-secondary)" : "#8f2c15",
          }}
        >
          {squash
            ? "root_squash ON → client root is mapped to 'nobody'. A compromised client can't own the share. Safe default."
            : "no_root_squash → client root keeps UID 0 on your share. Lab shortcut — production landmine. One compromised client owns every file."}
        </motion.div>
      </AnimatePresence>

      {/* command echo */}
      <div className="term-panel rounded-lg px-3.5 py-2.5 font-mono text-[12px]" aria-live="polite">
        <span style={{ color: V }}>$ </span>
        <span className="text-term-text">
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
      className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-[11px] transition-colors duration-150"
      style={{
        borderColor: active ? `${color}55` : "var(--border)",
        background: active ? `${color}12` : "var(--card)",
        color: active ? color : "var(--muted-foreground)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
