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

const TAG_HEX: Record<string, string> = {
  wargame: "#fbbf24",
  labs: "#7c5cff",
  sandbox: "#34d399",
  reference: "#22d3ee",
  course: "#f472b6",
};

export default function Resources() {
  return (
    <section id="resources" className="relative" aria-labelledby="resources-title">
      <div>
        <Reveal>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[#fbbf24]">
            <Compass className="h-4 w-4" />
            keep learning — verified platforms
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 id="resources-title" className="text-3xl font-semibold tracking-tight text-[#e8eefc] md:text-4xl">
            The best places to practise next
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8fa2c9] md:text-lg">
            Every platform below was checked before shipping — no dead links, no pay-walled bait. Start with Bandit if
            you want the classic hacker grind; jump into SadServers when you feel dangerous.
          </p>
        </Reveal>

        {/* platform grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.name} delay={0.04 * (i % 3)}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-white/8 bg-white/3 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/6"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider"
                    style={{ borderColor: `${TAG_HEX[p.tag]}55`, color: TAG_HEX[p.tag], background: `${TAG_HEX[p.tag]}12` }}
                  >
                    {TAG_ICONS[p.tag]}
                    {p.tag}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#64748b] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
                <p className="mt-3.5 text-[15px] font-semibold text-[#e8eefc]">{p.name}</p>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-[#8fa2c9]">{p.blurb}</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#64748b]">{p.topics}</p>
              </a>
            </Reveal>
          ))}
        </div>

        {/* hacker video picks */}
        <Reveal delay={0.1}>
          <div className="mt-14">
            <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#8fa2c9]">
              <Youtube className="h-4 w-4 text-[#4ade80]" />
              the hacker starter pack — three videos that made Linux click
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {HACKER_VIDEOS.map((v) => (
                <a
                  key={v.id}
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-2xl border border-white/8 bg-white/3 transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                      alt={`Thumbnail: ${v.title}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4ade80]">
                        <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                      </span>
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-[#e8eefc]">{v.title}</p>
                    <p className="mt-1.5 font-mono text-[10.5px] text-[#4ade80]">{v.channel}</p>
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-[#8fa2c9]">{v.blurb}</p>
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
