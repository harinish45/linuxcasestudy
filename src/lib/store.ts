"use client";

import { create } from "zustand";

export type AccentKey = "lvm" | "nfs" | "docker";
export type SectionId =
  | "hero"
  | "lvm"
  | "nfs"
  | "containers"
  | "pipeline"
  | "terminal"
  | "dashboard";

export const ACCENTS: Record<AccentKey, { hex: string; rgb: string; label: string }> = {
  lvm: { hex: "#7c5cff", rgb: "124, 92, 255", label: "LVM" },
  nfs: { hex: "#22d3ee", rgb: "34, 211, 238", label: "NFS" },
  docker: { hex: "#34d399", rgb: "52, 211, 153", label: "Containers" },
};

export const SECTION_IDS: SectionId[] = [
  "hero",
  "lvm",
  "nfs",
  "containers",
  "pipeline",
  "terminal",
  "dashboard",
];

interface LabState {
  activeSection: SectionId;
  heroAccent: AccentKey;
  paletteOpen: boolean;
  /** Intro gate: SSR default false → intro renders on first paint. */
  introDone: boolean;
  /** Bumped on "replay intro" so the intro remounts. */
  introNonce: number;
  setActiveSection: (s: SectionId) => void;
  setHeroAccent: (a: AccentKey) => void;
  setPaletteOpen: (open: boolean) => void;
  setIntroDone: (done: boolean) => void;
  replayIntro: () => void;
}

export const useLabStore = create<LabState>((set) => ({
  activeSection: "hero",
  heroAccent: "lvm",
  paletteOpen: false,
  introDone: false,
  introNonce: 0,
  setActiveSection: (s) => set({ activeSection: s }),
  setHeroAccent: (a) => set({ heroAccent: a }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setIntroDone: (done) => set({ introDone: done }),
  replayIntro: () => {
    // Clear the played-once flag or the remounted intro will skip itself.
    try {
      window.sessionStorage.removeItem("clu-intro-v2");
    } catch {
      /* private mode — fine */
    }
    set((s) => ({ introDone: false, introNonce: s.introNonce + 1 }));
  },
}));
