import type { Metadata } from "next";
import Resources from "@/components/sections/Resources";

export const metadata: Metadata = {
  title: "Resources | Linux Lab",
  description:
    "Verified practice platforms (OverTheWire, Killercoda, KodeKloud…) and the hacker starter video pack — every link checked live before shipping.",
};

export default function ResourcesPage() {
  return <Resources />;
}
