"use client";

import { ArrowUpRight, Compass, Youtube, GraduationCap, Gamepad2, Wrench, Terminal, Play } from "lucide-react";
import Reveal from "@/components/Reveal";
import { PLATFORMS, HACKER_VIDEOS } from "@/data/learning";

const TAG_ICONS: Record<string, React.ReactNode> = {
  wargame: <Gamepad2 className="h-3.5 w-3.5" />,
  labs: <Wrench className="h-3.5 w-3.5" />,
  sandbox: <Terminal className="h-3.5 w-3.5" />,
  reference: <Compass className="h-3.5 w-3.5" />,
  course: <GraduationCap className="h-3.5 w-3.5" />,
};

/** Restrained warm tag palette. */
const TAG_HEX: Record<string, string> = {
  wargame: "#6a9bcc",
  labs: "#d97757",
  sandbox: "#788c5d",
  reference: "#73726c",
  course: "#c6613f",
};

export default function Resources() {
  return (
    <section id="resources" className="relative" aria-labelledby="resources-title">
      <div>
        <Reveal y={6}>
          <p className="kicker mb-3 flex items-center gap-2">
            <Compass className="h-4 w-4 text-terracotta" />
            keep learning — verified platforms
          </p>
        </Reveal>
        <Reveal delay={0.05} y={10}>
          <h1 id="resources-title" className="display text-[32px] leading-[1.15] text-foreground md:text-[40px]">
            The best places to practise next
          </h1>
        </Reveal>
        <Reveal delay={0.1} y={10}>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
            Every platform below was checked before shipping — no dead links, no pay-walled bait.
            Start with Bandit if you want the classic grind; jump into SadServers when you feel
            dangerous.
          </p>
        </Reveal>

        {/* platform grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.name} delay={0.03 * (i % 3)} y={8}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group surface surface-hover flex h-full flex-col p-5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider"
                    style={{ color: TAG_HEX[p.tag], background: `${TAG_HEX[p.tag]}12` }}
                  >
                    {TAG_ICONS[p.tag]}
                    {p.tag}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-terracotta" />
                </div>
                <p className="mt-3.5 text-[15px] font-semibold text-foreground">{p.name}</p>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {p.blurb}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
                  {p.topics}
                </p>
              </a>
            </Reveal>
          ))}
        </div>

        {/* starter video picks */}
        <Reveal y={8} delay={0.08}>
          <div className="mt-14">
            <p className="kicker mb-4 flex items-center gap-2">
              <Youtube className="h-4 w-4 text-terracotta" />
              the starter pack — three videos that made Linux click
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {HACKER_VIDEOS.map((v) => (
                <a
                  key={v.id}
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group surface surface-hover overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                      alt={`Thumbnail: ${v.title}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                        <Play className="ml-0.5 h-4 w-4 fill-[#141413] text-[#141413]" />
                      </span>
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-foreground">
                      {v.title}
                    </p>
                    <p className="mt-1.5 font-mono text-[10.5px] text-terracotta-deep">{v.channel}</p>
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                      {v.blurb}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
