import SmoothScroll from "@/components/providers/SmoothScroll";
import { ToastProvider } from "@/components/providers/ToastProvider";
import AuroraBackground from "@/components/providers/AuroraBackground";
import Cursor from "@/components/providers/Cursor";
import ProgressRail from "@/components/providers/ProgressRail";
import NavBar from "@/components/providers/NavBar";
import CommandPalette from "@/components/providers/CommandPalette";
import LabRoot from "@/components/LabRoot";
import Hero from "@/components/sections/Hero";
import CaseLVM from "@/components/sections/CaseLVM";
import CaseNFS from "@/components/sections/CaseNFS";
import CaseDocker from "@/components/sections/CaseDocker";
import Integration from "@/components/sections/Integration";
import TerminalLab from "@/components/sections/TerminalLab";
import Dashboard from "@/components/sections/Dashboard";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <ToastProvider>
        <AuroraBackground />
        <div className="grain" aria-hidden />
        <Cursor />
        <LabRoot>
          <NavBar />
          <ProgressRail />
          <CommandPalette />

          <main className="relative flex min-h-screen flex-col">
            <Hero />
            <CaseLVM />
            <CaseNFS />
            <CaseDocker />
            <Integration />
            <TerminalLab />
            <Dashboard />
          </main>
          <Footer />
        </LabRoot>
      </ToastProvider>
    </SmoothScroll>
  );
}
