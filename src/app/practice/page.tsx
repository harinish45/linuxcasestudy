import type { Metadata } from "next";
import PracticeArena from "@/components/sections/PracticeArena";

export const metadata: Metadata = {
  title: "Challenge Arena | Linux Lab",
  description:
    "LeetCode-style practice for the Linux terminal: quiz + command challenges across LVM, NFS and containers, with XP and saved progress.",
};

export default function PracticePage() {
  return <PracticeArena />;
}
