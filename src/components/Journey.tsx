"use client";

import { useRef } from "react";
import { timeline } from "@/content/timeline";
import { gsap, useGSAP, MOTION } from "@/lib/gsap";

export function Journey() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        // The accent line draws down the timeline as you scroll.
        gsap.fromTo(
          "[data-line-fill]",
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-timeline]", start: "top 65%", end: "bottom 65%", scrub: true } },
        );
        gsap.utils.toArray<HTMLElement>("[data-milestone]").forEach((row) => {
          gsap.from(row, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 85%" } });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative z-10 px-5 py-24 md:px-10 md:py-32" aria-labelledby="journey">
      <h2 id="journey" className="text-center text-[clamp(2.4rem,6vw,5rem)] leading-[1.02] font-medium tracking-tight">
        My journey &amp;
        <br />
        <span className="text-accent">milestones</span>
      </h2>

      <div data-timeline className="relative mx-auto mt-20 max-w-6xl">
        <div className="absolute top-0 bottom-0 left-[7px] w-px bg-line md:left-1/2" aria-hidden="true">
          <div data-line-fill className="h-full w-full origin-top bg-linear-to-b from-accent to-accent/20" />
        </div>
        <ol>
          {timeline.map((m) => (
            <li
              key={`${m.when}-${m.title}`}
              data-milestone
              className="relative grid gap-2 pb-16 pl-10 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0"
            >
              <span
                className="absolute top-2 left-0 size-[15px] rounded-full border-2 border-bg bg-accent shadow-[0_0_18px_rgb(79_125_255/0.8)] md:left-1/2 md:-translate-x-1/2"
                aria-hidden="true"
              />
              <div className="md:flex md:items-start md:justify-between md:gap-6 md:pr-10">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{m.title}</h3>
                  <p className="mt-1 text-sm text-accent-soft">{m.org}</p>
                </div>
                <p className="display mt-3 text-4xl text-ink/25 tabular-nums md:mt-0 md:text-6xl">{m.when}</p>
              </div>
              <p className="max-w-md leading-relaxed text-ink/75 md:pl-10">{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
