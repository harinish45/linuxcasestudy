import SmoothScroll from "@/components/providers/SmoothScroll";
import { ToastProvider } from "@/components/providers/ToastProvider";
import AuroraBackground from "@/components/providers/AuroraBackground";
import SparkCursor from "@/components/SparkCursor";
import ProgressRail from "@/components/providers/ProgressRail";
import NavBar from "@/components/providers/NavBar";
import CommandPalette from "@/components/providers/CommandPalette";
import LabRoot from "@/components/LabRoot";
import HeroLearn from "@/components/sections/HeroLearn";
import TopicSection from "@/components/sections/TopicSection";
import PracticeArena from "@/components/sections/PracticeArena";
import TerminalLab from "@/components/sections/TerminalLab";
import Resources from "@/components/sections/Resources";
import Footer from "@/components/sections/Footer";
import { TOPICS } from "@/data/learning";

export default function Home() {
  return (
    <SmoothScroll>
      <ToastProvider>
        <AuroraBackground />
        <div className="grain" aria-hidden />
        <SparkCursor />
        <LabRoot>
          <NavBar />
          <ProgressRail />
          <CommandPalette />

          <main className="relative flex min-h-screen flex-col">
            <HeroLearn />
            {TOPICS.map((t) => (
              <TopicSection key={t.key} topic={t} />
            ))}
            <PracticeArena />
            <TerminalLab />
            <Resources />
          </main>
          <Footer />
        </LabRoot>
      </ToastProvider>
    </SmoothScroll>
  );
}
