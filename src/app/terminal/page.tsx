import type { Metadata } from "next";
import TerminalLab from "@/components/sections/TerminalLab";

export const metadata: Metadata = {
  title: "Terminal Lab | Linux Lab",
  description:
    "Scripted LVM, NFS and Docker scenarios that type themselves in a live simulated terminal — copy everything or download the .sh.",
};

export default function TerminalPage() {
  return <TerminalLab />;
}
