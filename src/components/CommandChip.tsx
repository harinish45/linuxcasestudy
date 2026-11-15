"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/hooks";
import { useToast } from "@/components/providers/ToastProvider";

interface Props {
  cmd: string;
  note?: string;
  accentHex?: string;
  compact?: boolean;
}

/** Copyable command chip; icon morphs into a checkmark + "Copied!" toast. */
export default function CommandChip({ cmd, note, accentHex = "#7c5cff", compact }: Props) {
  const [copied, setCopied] = useState(false);
  const { push } = useToast();

  const onCopy = async () => {
    const ok = await copyText(cmd);
    if (ok) {
      setCopied(true);
      push({ title: "Copied!", description: cmd, tone: "success" });
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      push({ title: "Copy failed", description: "Select the text manually.", tone: "error" });
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <button
        onClick={onCopy}
        data-cursor="copy"
        data-cursor-label="copy"
        aria-label={`Copy command: ${cmd}`}
        className="group flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-[#05070f]/70 px-3 py-2 text-left transition-all duration-200 hover:border-white/25 hover:bg-[#0a0e1c]/80"
      >
        <span className="shrink-0 font-mono text-xs" style={{ color: accentHex }}>
          $
        </span>
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] leading-relaxed text-[#e8eefc] scrollbar-none">
          {cmd}
        </code>
        <span className="relative h-4 w-4 shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Check className="h-4 w-4 text-emerald-400" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[#8fa2c9] transition-colors group-hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
      {note && !compact && (
        <p className="pl-3 text-[11px] leading-snug text-[#8fa2c9]">{note}</p>
      )}
    </div>
  );
}
