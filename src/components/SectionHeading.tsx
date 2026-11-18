"use client";

import Reveal from "@/components/Reveal";

interface Props {
  kicker: string;
  title: string;
  description?: string;
  accentHex?: string;
  glowClass?: string;
}

/** Editorial section heading — serif display, quiet kicker. */
export default function SectionHeading({ kicker, title, description, glowClass }: Props) {
  return (
    <div className="mb-10 max-w-3xl md:mb-12">
      <Reveal y={6}>
        <p className="kicker mb-3">{kicker}</p>
      </Reveal>
      <Reveal delay={0.05} y={10}>
        <h1 className={`display text-[32px] leading-[1.15] text-foreground md:text-[40px] ${glowClass ?? ""}`}>
          {title}
        </h1>
      </Reveal>
      {description && (
        <Reveal delay={0.1} y={10}>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
