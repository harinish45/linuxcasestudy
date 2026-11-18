"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { ROUTES, useProgressStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Footer from "@/components/sections/Footer";

/**
 * Learning-platform shell: fixed sidebar (desktop) / slide-over (mobile),
 * a slim top bar, and a centered reading column with generous spacing —
 * the way a premium course platform is arranged.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const setLastCourse = useProgressStore((s) => s.setLastCourse);
  const isCourse = pathname.startsWith("/courses/");

  // Remember the last visited course for "continue learning".
  useEffect(() => {
    if (isCourse) setLastCourse(pathname);
  }, [isCourse, pathname, setLastCourse]);

  // Warm every route while the browser is idle, so clicking LVM / NFS /
  // Containers swaps instantly (no-op in dev where prefetching is off).
  useEffect(() => {
    const warm = () => {
      for (const r of Object.values(ROUTES)) router.prefetch(r);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => warm());
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-[252px]">
        <TopBar />
        <main className="relative mx-auto w-full max-w-[880px] flex-1 px-5 pb-16 pt-8 md:px-10 md:pt-10">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
