"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { pillars } from "@/content/pillars";
import { gsap, useGSAP, MOTION } from "@/lib/gsap";

export function WhatIDo() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.from("[data-pillar]", {
          y: 60,
          opacity: 0,
          stagger: 0.15,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative z-10 px-5 py-24 md:px-10 md:py-32" aria-labelledby="what-i-do">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <h2
          id="what-i-do"
          className="text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-tight lg:sticky lg:top-32 lg:self-start"
        >
          What I <span className="text-accent">do</span>
        </h2>
        <div className="flex flex-col gap-6">
          {pillars.map((p, i) => {
            const isOpen = open === i;
            return (
              <article
                key={p.title}
                data-pillar
                className="bracket group p-7 transition-colors hover:bg-white/[0.02] md:p-9"
                onMouseEnter={() => setOpen(i)}
              >
                <span className="bracket-b" aria-hidden="true" />
                <h3 className="display text-3xl md:text-4xl">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.subtitle}</p>
                <p className="mt-5 max-w-prose leading-relaxed text-ink/85">{p.text}</p>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`pillar-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="mt-6 flex w-full items-center justify-between border-t border-line pt-4 text-left text-sm font-medium"
                >
                  Skillset and tools
                  <ChevronDown className={`size-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                <div
                  id={`pillar-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <ul className="flex min-h-0 flex-wrap gap-2 overflow-hidden" inert={!isOpen}>
                    {p.tools.map((t) => (
                      <li key={t} className="mt-4 rounded-full border border-line px-3 py-1 text-xs text-ink/80">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
