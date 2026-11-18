import type { Metadata } from "next";
import CourseView from "@/components/course/CourseView";

export const metadata: Metadata = {
  title: "Containers — Ship it once | Linux Lab",
  description:
    "Learn Docker visually: images vs containers, the lifecycle state machine, volumes and layers — with copy-ready notes, verified videos and graded challenges.",
};

export default function ContainersPage() {
  return <CourseView topicKey="docker" />;
}
