"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Light cream by default; warm charcoal available via the toggle. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
