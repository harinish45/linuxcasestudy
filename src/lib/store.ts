"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AccentKey = "lvm" | "nfs" | "docker";
export type TopicKey = AccentKey;

/** App routes — the platform is multi-page now, not one long scroll. */
export const ROUTES = {
  home: "/",
  lvm: "/courses/lvm",
  nfs: "/courses/nfs",
  containers: "/courses/containers",
  practice: "/practice",
  arena: "/arena",
  terminal: "/terminal",
  pipeline: "/pipeline",
  resources: "/resources",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/** Topic key → route (topics use "docker", the route is "containers"). */
export const topicRoute = (k: TopicKey): Route =>
  k === "docker" ? ROUTES.containers : k === "nfs" ? ROUTES.nfs : ROUTES.lvm;

export const ACCENTS: Record<AccentKey, { hex: string; rgb: string; label: string }> = {
  lvm: { hex: "#d97757", rgb: "217, 119, 87", label: "LVM" },
  nfs: { hex: "#6a9bcc", rgb: "106, 155, 204", label: "NFS" },
  docker: { hex: "#788c5d", rgb: "120, 140, 93", label: "Containers" },
};

interface LabState {
  /** Boot intro gate: SSR default false → intro renders on first paint. */
  introDone: boolean;
  /** Bumped on "replay intro" so the intro remounts. */
  introNonce: number;
  /** Mobile slide-over sidebar visibility. */
  sidebarOpen: boolean;
  paletteOpen: boolean;
  setIntroDone: (done: boolean) => void;
  replayIntro: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useLabStore = create<LabState>((set) => ({
  introDone: false,
  introNonce: 0,
  sidebarOpen: false,
  paletteOpen: false,
  setIntroDone: (done) => set({ introDone: done }),
  replayIntro: () => {
    // Clear the played-once flag or the remounted intro will skip itself.
    try {
      window.sessionStorage.removeItem("clu-boot-v1");
    } catch {
      /* private mode — fine */
    }
    set((s) => ({ introDone: false, introNonce: s.introNonce + 1 }));
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
}));

/* ────────────────────────────────────────────────────────────────────── */
/* Learning progress — persisted in localStorage.                          */
/* ────────────────────────────────────────────────────────────────────── */

export interface LearningProgress {
  /** Chapter keys the learner marked complete. */
  completed: TopicKey[];
  /** Last course route visited ("continue learning"). */
  lastCourse: string | null;
  /** Completed module-lesson keys ("topic:moduleId-lN"). */
  lessonsDone: string[];
  markComplete: (k: TopicKey) => void;
  markIncomplete: (k: TopicKey) => void;
  toggleLesson: (k: TopicKey, moduleId: string, lessonId: string) => void;
  setLastCourse: (route: string) => void;
  resetProgress: () => void;
}

const PROGRESS_DEFAULT = {
  completed: [] as TopicKey[],
  lastCourse: null as string | null,
  lessonsDone: [] as string[],
};

export const useProgressStore = create<LearningProgress>()(
  persist(
    (set) => ({
      ...PROGRESS_DEFAULT,
      markComplete: (k) =>
        set((s) => ({ completed: s.completed.includes(k) ? s.completed : [...s.completed, k] })),
      markIncomplete: (k) => set((s) => ({ completed: s.completed.filter((c) => c !== k) })),
      toggleLesson: (k, moduleId, lessonId) =>
        set((s) => {
          const key = `${k}:${moduleId}:${lessonId}`;
          return {
            lessonsDone: s.lessonsDone.includes(key)
              ? s.lessonsDone.filter((x) => x !== key)
              : [...s.lessonsDone, key],
          };
        }),
      setLastCourse: (route) => set({ lastCourse: route }),
      resetProgress: () => set(PROGRESS_DEFAULT),
    }),
    {
      name: "clu-progress-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        completed: s.completed,
        lastCourse: s.lastCourse,
        lessonsDone: s.lessonsDone,
      }),
    }
  )
);
