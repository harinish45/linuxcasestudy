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

/** Copyable command chip; icon morphs into a checkmark + toast. */
export default function CommandChip({ cmd, note, accentHex = "#d97757", compact }: Props) {
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
        aria-label={`Copy command: ${cmd}`}
        className="group term-panel flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:border-[#5a554b]"
      >
        <span className="shrink-0 font-mono text-xs" style={{ color: accentHex }}>
          $
        </span>
        <code className="scrollbar-none min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] leading-relaxed text-term-text">
          {cmd}
        </code>
        <span className="relative h-4 w-4 shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="h-4 w-4 text-[#a7b98a]" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[#8f8b80] transition-colors group-hover:text-[#edeae2]"
              >
                <Copy className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
      {note && !compact && <p className="pl-3 text-[11.5px] leading-snug text-muted-foreground">{note}</p>}
    </div>
  );
}
