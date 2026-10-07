"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION } from "@/lib/gsap";

const ABOUT =
  "I'm a first-year Computer Science student at SJEC, Mangalore, and I like shipping things people actually use. I've built an online store and the home server it runs on, a notch app for Windows, an Android alarm you have to walk to switch off, and a Chrome extension that does a company's invoicing for it. Away from the keyboard I design parts in CAD and 3D-print them.";

const FACTS = [
  ["01", "B.E. Computer Science, SJEC"],
  ["02", "I run my own production server"],
  ["03", "National Spell Bee winner, 2020"],
];

export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        // Words light up one by one as the paragraph scrolls through the viewport.
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: { trigger: "[data-about-text]", start: "top 78%", end: "bottom 50%", scrub: true },
          },
        );
        gsap.from("[data-fact]", {
          y: 24,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-facts]", start: "top 88%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="about" ref={root} className="relative z-10 px-5 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">About me</p>
        <p data-about-text className="mt-8 text-[clamp(1.6rem,3.5vw,3.3rem)] leading-[1.18] font-semibold tracking-tight">
          {ABOUT.split(" ").map((word, i) => (
            <span key={i} data-word>
              {word}{" "}
            </span>
          ))}
        </p>
        <ul data-facts className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {FACTS.map(([n, fact]) => (
            <li key={n} data-fact className="flex items-baseline gap-4 bg-bg px-6 py-5">
              <span className="font-mono text-xs text-accent-soft">{n}</span>
              <span className="text-sm text-ink/85">{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
