"use client";

import dynamic from "next/dynamic";
import { useLabStore } from "@/lib/store";

const LaptopIntro = dynamic(() => import("@/components/LaptopIntro"), { ssr: false });

/**
 * Client root: owns the intro gate so the whole page can stay a server
 * component tree below it. The intro renders above everything (z-95) and
 * unmounts itself once the visitor enters, skips, or has already seen it.
 */
export default function LabRoot({ children }: { children: React.ReactNode }) {
  const introDone = useLabStore((s) => s.introDone);
  const introNonce = useLabStore((s) => s.introNonce);

  return (
    <>
      {!introDone && <LaptopIntro key={introNonce} />}
      {children}
    </>
  );
}
