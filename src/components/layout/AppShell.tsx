"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useProgressStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Footer from "@/components/sections/Footer";

/**
 * Learning-platform shell: fixed sidebar (desktop) / slide-over (mobile),
 * a slim top bar, and a centered content column with generous spacing —
 * the way a real course platform is arranged.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setLastCourse = useProgressStore((s) => s.setLastCourse);
  const isCourse = pathname.startsWith("/courses/");

  // Remember the last visited course for "continue learning".
  useEffect(() => {
    if (isCourse) setLastCourse(pathname);
  }, [isCourse, pathname, setLastCourse]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <TopBar />
        <main className="relative mx-auto w-full max-w-[1060px] flex-1 px-5 pb-10 pt-8 md:px-10 md:pt-10">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
