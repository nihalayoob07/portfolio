"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PhoneScreen } from "@/content/projects";

// A phone you can tap through. It advances on its own while on screen until someone takes over.
export function PhonePreview({ screens, title }: { screens: PhoneScreen[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const many = screens.length > 1;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!many || !auto || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % screens.length), 2800);
    return () => window.clearInterval(id);
  }, [many, auto, visible, screens.length]);

  const go = (step: number) => {
    setAuto(false);
    setIndex((i) => (i + step + screens.length) % screens.length);
  };

  return (
    <div
      ref={root}
      className="flex h-full w-full items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_60%,rgb(79_125_255/0.18),transparent_65%)] px-3 py-4"
    >
      {many && (
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous screen"
          className="rounded-full border border-line p-1.5 text-ink/70 hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      )}
      <div className="flex h-full min-h-0 flex-col items-center gap-2">
        <div className="relative aspect-[9/19.5] h-full min-h-0 overflow-hidden rounded-[1.4rem] border-[5px] border-[#1d1d24] bg-black shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]">
          {screens.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- small pre-sized captures, swapped by opacity
            <img
              key={s.src}
              src={s.src}
              alt={i === index ? `${title}: ${s.label}` : ""}
              aria-hidden={i !== index}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          {many && <button type="button" className="absolute inset-0 cursor-pointer" aria-label="Next screen" onClick={() => go(1)} />}
        </div>
        <p className="shrink-0 font-mono text-[10px] tracking-widest text-ink/55 uppercase" aria-live="polite">
          {screens[index].label}
          {many && (
            <span className="text-ink/30">
              {" "}
              · {index + 1}/{screens.length}
            </span>
          )}
        </p>
      </div>
      {many && (
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next screen"
          className="rounded-full border border-line p-1.5 text-ink/70 hover:text-ink"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
