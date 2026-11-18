import type { Metadata } from "next";
import PipelineView from "@/components/pipeline/PipelineView";

export const metadata: Metadata = {
  title: "Integration Pipeline | Linux Lab",
  description:
    "Drag one slider: lvextend grows a logical volume, the NFS share and every container mounted on it react live — the three chapters as one stack.",
};

export default function PipelinePage() {
  return <PipelineView />;
}
