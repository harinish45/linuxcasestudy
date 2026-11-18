import type { Metadata } from "next";
import CourseView from "@/components/course/CourseView";

export const metadata: Metadata = {
  title: "LVM — Storage that grows | Linux Lab",
  description:
    "Learn LVM visually: PV → VG → LV, online growing with lvextend -r, snapshots and rollback — with copy-ready notes, verified videos and graded challenges.",
};

export default function LvmPage() {
  return <CourseView topicKey="lvm" />;
}
