import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Linux Lab — Learn LVM, NFS & Containers the Hacker Way",
  description:
    "A hands-on learning lab: animated LVM, NFS and container diagrams, copy-ready practice notes, verified YouTube lessons, and a LeetCode-style practice arena that grades your terminal skills.",
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
    title: "Linux Lab — Learn LVM, NFS & Containers the Hacker Way",
    description:
      "Visual lessons, practice notes, verified videos and a challenge arena for LVM storage, NFS sharing and Docker containers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
