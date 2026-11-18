"use client";

import dynamic from "next/dynamic";
import { useLabStore } from "@/lib/store";

const BootIntro = dynamic(() => import("@/components/BootIntro"), { ssr: false });

/**
 * Client root: owns the intro gate so the whole page can stay a server
 * component tree below it. The hacker boot intro renders above everything
 * (z-95) and unmounts itself once the visitor enters, skips, or has
 * already seen it this session.
 */
export default function LabRoot({ children }: { children: React.ReactNode }) {
  const introDone = useLabStore((s) => s.introDone);
  const introNonce = useLabStore((s) => s.introNonce);

  return (
    <>
      {!introDone && <BootIntro key={introNonce} />}
      {children}
    </>
  );
}
