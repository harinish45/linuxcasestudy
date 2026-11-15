"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastApi {
  push: (t: { title: string; description?: string; tone?: Tone }) => void;
}

const ToastCtx = createContext<ToastApi>({ push: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

const TONE_STYLES: Record<Tone, { icon: React.ReactNode; ring: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    ring: "shadow-[0_8px_40px_rgba(52,211,153,0.18)]",
  },
  error: {
    icon: <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />,
    ring: "shadow-[0_8px_40px_rgba(248,113,113,0.18)]",
  },
  info: {
    icon: <Info className="h-4 w-4 text-[#7c5cff] shrink-0" />,
    ring: "shadow-[0_8px_40px_rgba(124,92,255,0.18)]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ title, description, tone = "info" }: { title: string; description?: string; tone?: Tone }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[90] flex w-[min(92vw,360px)] flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`glass-strong flex items-start gap-3 rounded-xl px-4 py-3 ${TONE_STYLES[t.tone].ring}`}
            >
              {TONE_STYLES[t.tone].icon}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#e8eefc]">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[#8fa2c9]">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-[#8fa2c9] transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
