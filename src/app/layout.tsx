import type { Metadata, Viewport } from "next";
import { Newsreader, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import AuroraBackground from "@/components/providers/AuroraBackground";
import SparkCursor from "@/components/SparkCursor";
import CommandPalette from "@/components/providers/CommandPalette";
import LabRoot from "@/components/LabRoot";
import AppShell from "@/components/layout/AppShell";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Linux Lab — Learn LVM, NFS & Containers",
  description:
    "A calm, hands-on learning platform: interactive LVM, NFS and container diagrams, copy-ready practice notes, verified YouTube lessons, and a LeetCode-style practice arena that grades your terminal skills.",
  keywords: [
    "Linux",
    "learn Linux",
    "LVM tutorial",
    "NFS tutorial",
    "Docker tutorial",
    "containers",
    "practice",
    "OverTheWire",
    "devops labs",
  ],
  authors: [{ name: "Linux Lab" }],
  openGraph: {
    title: "Linux Lab — Learn LVM, NFS & Containers",
    description:
      "Visual lessons, practice notes, verified videos and a challenge arena for LVM storage, NFS sharing and Docker containers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${sourceSans.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider>
          <ToastProvider>
            <AuroraBackground />
            <div className="grain" aria-hidden />
            <SparkCursor />
            <LabRoot>
              <AppShell>
                <CommandPalette />
                {children}
              </AppShell>
            </LabRoot>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
