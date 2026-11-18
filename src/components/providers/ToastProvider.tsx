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

const TONE_STYLES: Record<Tone, { icon: React.ReactNode }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-sage" />,
  },
  error: {
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />,
  },
  info: {
    icon: <Info className="h-4 w-4 shrink-0 text-terracotta" />,
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
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="surface flex items-start gap-3 px-4 py-3 shadow-[0_6px_24px_rgba(20,20,19,0.10)]"
            >
              {TONE_STYLES[t.tone].icon}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
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
