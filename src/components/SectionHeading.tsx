"use client";

import Reveal from "@/components/Reveal";

interface Props {
  kicker: string;
  title: string;
  description?: string;
  accentHex: string;
  glowClass?: string;
}

export default function SectionHeading({ kicker, title, description, accentHex, glowClass }: Props) {
  return (
    <div className="mb-10 max-w-3xl md:mb-14">
      <Reveal>
        <p
          className="mb-3 font-mono text-xs uppercase tracking-[0.3em]"
          style={{ color: accentHex }}
        >
          {kicker}
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className={`text-3xl font-semibold tracking-tight text-[#e8eefc] md:text-5xl ${glowClass ?? ""}`}>
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p className="mt-4 text-base leading-relaxed text-[#8fa2c9] md:text-lg">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
