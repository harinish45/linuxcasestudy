import type { Metadata } from "next";
import CourseView from "@/components/course/CourseView";

export const metadata: Metadata = {
  title: "NFS — One share, every machine | Linux Lab",
  description:
    "Learn NFS visually: exports, mounts, sync vs async, root_squash and setgid team shares — with copy-ready notes, verified videos and graded challenges.",
};

export default function NfsPage() {
  return <CourseView topicKey="nfs" />;
}
