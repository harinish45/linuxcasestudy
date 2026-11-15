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
  title: "Comprehensive Linux — Case Study Lab",
  description:
    "LVM · NFS · Containers — three hands-on case studies and one integrated pipeline. An interactive engineering lab with live 3D scenes, real commands and verification results.",
  keywords: [
    "Linux",
    "LVM",
    "NFS",
    "Docker",
    "containers",
    "case study",
    "storage",
    "devops",
  ],
  authors: [{ name: "Case Study Lab" }],
  openGraph: {
    title: "Comprehensive Linux — Case Study Lab",
    description:
      "Three case studies, one lab: LVM storage pools, NFS shared storage and Docker containers, composed into a single pipeline.",
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
