"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useLabStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/hooks";
import LaptopIntroFallback, { IntroChrome } from "@/components/LaptopIntroFallback";

const LaptopScene = dynamic(() => import("@/components/three/LaptopScene"), { ssr: false });

/** Hydration-safe "are we on the client" flag (false on server snapshot). */
const mountedStore = {
  subscribe: () => () => {},
  getClient: () => true,
  getServer: () => false,
};
function useMounted() {
  return useSyncExternalStore(mountedStore.subscribe, mountedStore.getClient, mountedStore.getServer);
}

/** WebGL probe cached at module level (no state, no re-render). */
let webglCache: boolean | null = null;
function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    webglCache = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/**
 * Boot-of-the-lab intro: a 3D laptop floats up out of the dark, the lid
 * springs open, the screen runs a boot sequence, then the visitor enters.
 *
 * Device policy (decided exactly once, at mount — no post-hydration swaps):
 *  - desktop + WebGL → full three.js scene (lightweight, one-shot)
 *  - phones / reduced-motion / no WebGL → SVG laptop, same choreography
 *  - played once per tab (sessionStorage), replayable from the footer
 */
export default function LaptopIntro() {
  const setIntroDone = useLabStore((s) => s.setIntroDone);
  const mounted = useMounted();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Only play once per tab session (skip on back/forward navigations).
  // Deferred a tick so the canvas teardown never lands inside React's commit.
  useEffect(() => {
    let played = false;
    try {
      played = window.sessionStorage.getItem("clu-intro-v2") === "1";
    } catch {
      played = false;
    }
    if (!played) return;
    const t = window.setTimeout(() => setIntroDone(true), 80);
    return () => window.clearTimeout(t);
  }, [setIntroDone]);

  // Scroll lock while the intro is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const flavour: "pending" | "3d" | "svg" = !mounted
    ? "pending"
    : isMobile || reduced || !hasWebGL()
      ? "svg"
      : "3d";

  return (
    <>
      {/* pre-hydration shell: seamless dark screen so nothing flashes */}
      {flavour === "pending" && <div className="fixed inset-0 z-[95] bg-[#05070f]" />}
      {flavour === "svg" && <LaptopIntroFallback onDone={() => setIntroDone(true)} reduced={reduced} />}
      {flavour === "3d" && <Intro3D onDone={() => setIntroDone(true)} />}
    </>
  );
}

/** three.js flavour of the intro — canvas + shared chrome + enter transition. */
function Intro3D({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"boot" | "ready" | "entering">("boot");
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      window.sessionStorage.setItem("clu-intro-v2", "1");
    } catch {
      /* private mode — fine */
    }
    onDone();
  };

  const enter = () => {
    setPhase("entering");
    window.setTimeout(finish, 950);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "Enter") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[95] overflow-hidden bg-[#05070f]">
      {/* ambient glow behind the machine */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 46% at 50% 46%, rgba(124,92,255,0.13) 0%, rgba(34,211,238,0.05) 42%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 transition-all duration-[900ms]"
        style={{ filter: phase === "entering" ? "brightness(2.1) blur(6px)" : undefined }}
      >
        <LaptopScene
          reduced={false}
          onReady={() => setPhase((p) => (p === "boot" ? "ready" : p))}
          entering={phase === "entering"}
        />
      </div>

      {/* white-out flash on enter */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#e8eefc] opacity-0 transition-opacity duration-700"
        style={{ opacity: phase === "entering" ? 0.9 : 0, transitionDelay: "250ms" }}
      />

      <IntroChrome
        ready={phase === "ready"}
        reduced={false}
        onEnter={enter}
        onSkip={finish}
        entering={phase === "entering"}
      />
    </div>
  );
}
