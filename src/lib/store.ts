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
  setActiveSection: (s: SectionId) => void;
  setHeroAccent: (a: AccentKey) => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useLabStore = create<LabState>((set) => ({
  activeSection: "hero",
  heroAccent: "lvm",
  paletteOpen: false,
  setActiveSection: (s) => set({ activeSection: s }),
  setHeroAccent: (a) => set({ heroAccent: a }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
}));
