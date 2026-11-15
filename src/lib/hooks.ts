"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Media query via useSyncExternalStore (SSR-safe, hydration-safe). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** True on phones/tablets where 3D canvas is replaced with SVG diagrams. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

// One-time low-power probe (cached at module level).
let lowPowerCache: boolean | null = null;
function computeLowPower(): boolean {
  if (lowPowerCache !== null) return lowPowerCache;
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 4;
    const mem = nav.deviceMemory ?? 8;
    let webglOk = true;
    try {
      const canvas = document.createElement("canvas");
      webglOk = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webglOk = false;
    }
    lowPowerCache = cores <= 2 || (cores <= 4 && mem <= 4) || !webglOk;
  } catch {
    lowPowerCache = false;
  }
  return lowPowerCache;
}

/**
 * Low-power / capability probe for the static poster fallback:
 * few cores, missing WebGL, or a low device-memory hint.
 */
export function useLowPower(): boolean {
  return useSyncExternalStore(
    () => () => {},
    computeLowPower,
    () => false
  );
}

/** IntersectionObserver: "has the element entered the viewport?" */
export function useInViewOnce<T extends HTMLElement>(rootMargin = "320px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);
  return { ref, inView };
}

/** Continuous in-viewport detection (for pausing render loops). */
export function useOnScreen<T extends HTMLElement>(rootMargin = "160px") {
  const ref = useRef<T | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, onScreen };
}

/** Clipboard with a textarea fallback (sandboxed iframes may block async clipboard). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
