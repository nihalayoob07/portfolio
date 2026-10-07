"use client";

import { createContext, use, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";

type Link = { label: string; href: string };

const ShowcaseContext = createContext({ onScreen: false });
// Whether this panel is in the viewport (so 3D scenes can stop rendering when it isn't).
export const useShowcase = () => use(ShowcaseContext);

// A full-screen panel, as on preymaker.com: the stage is fixed and clipped to the panel, so the
// next panel wipes over this one as you scroll. Its height sets how much scrolling its reel gets.
export function Showcase({
  id,
  index,
  total,
  title,
  category,
  status,
  summary,
  links = [],
  screens,
  children,
}: {
  id: string;
  index: number;
  total: number;
  title: string;
  category: string;
  status?: string;
  summary: string;
  links?: Link[];
  screens: number;
  children: ReactNode;
}) {
  const article = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = article.current!;
    // Mount the reel a screen ahead and drop it once well past, so only nearby panels hold images or WebGL.
    const nearObs = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "100% 0px" });
    const seenObs = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    nearObs.observe(el);
    seenObs.observe(el);
    return () => {
      nearObs.disconnect();
      seenObs.disconnect();
    };
  }, []);

  const num = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <article
      ref={article}
      id={id}
      data-showcase
      aria-labelledby={`${id}-title`}
      className="relative [clip-path:inset(0)]"
      style={{ height: `${screens * 100}vh` }}
    >
      <div className="fixed inset-0 overflow-hidden bg-bg" inert={!onScreen}>
        <ShowcaseContext value={{ onScreen }}>{near && children}</ShowcaseContext>

        <div data-dim className="pointer-events-none absolute inset-0 bg-bg/75 backdrop-blur-lg" aria-hidden="true" />

        <div data-intro className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="eyebrow">
            {num} · {category}
          </p>
          <h3 id={`${id}-title`} className="display mt-5 text-[clamp(2rem,10vw,9.5rem)] break-words">
            {title}
          </h3>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">{summary}</p>
          {links.length > 0 && (
            <div className="pointer-events-auto mt-7 flex flex-wrap justify-center gap-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-4 py-2 text-sm font-medium backdrop-blur hover:border-accent hover:text-accent-soft"
                >
                  {l.label} <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div
          data-label
          className="invisible absolute bottom-5 left-5 flex flex-wrap items-center gap-x-4 gap-y-2 md:bottom-8 md:left-8 lg:left-24"
        >
          <span className="rounded-full border border-line bg-bg/75 px-4 py-2 text-sm backdrop-blur">
            <span className="font-mono text-xs text-ink/55">{String(index + 1).padStart(2, "0")}</span>
            <span className="ml-2.5 font-semibold">{title}</span>
            {status && <span className="ml-2.5 text-ink/55">{status}</span>}
          </span>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-line bg-bg/75 px-3.5 py-2 text-sm font-medium text-accent-soft backdrop-blur hover:text-ink"
            >
              {l.label} <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

// A fixed-size logical screen (the recording's own pixels), scaled to fit the stage below the
// site header. Everything inside is positioned in those pixels, so recorded coordinates work as-is.
// On portrait phones a landscape screen would be tiny, so it's shown at twice the size and pans
// sideways to keep `follow` (the demo cursor) in view.
export function Screen({
  width,
  height,
  fill = 1,
  follow,
  className = "",
  children,
}: {
  width: number;
  height: number;
  fill?: number;
  follow?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let fit = { w: 0, h: 0, s: 1, zoomed: false };
    let pan = 0;
    const place = () => {
      const { w, h, s, zoomed } = fit;
      const spare = width * s - w;
      if (zoomed && follow?.current) {
        const x = Number(gsap.getProperty(follow.current, "x")) * s;
        pan += (Math.min(Math.max(x - w / 2, 0), spare) - pan) * 0.12;
      } else pan = spare / 2;
      inner.current!.style.transform = `translate(${-pan}px, ${(h - height * s) / 2}px) scale(${s})`;
    };
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      const s = Math.min(w / width, h / height) * fill;
      const zoomed = !!follow && w / h < 0.8;
      fit = { w, h, s: zoomed ? Math.min(s * 2, (h * 0.7) / height) : s, zoomed };
      place();
    });
    ro.observe(box.current!);
    if (follow) gsap.ticker.add(place);
    return () => {
      ro.disconnect();
      gsap.ticker.remove(place);
    };
  }, [width, height, fill, follow]);
  return (
    <div ref={box} className="absolute inset-x-0 top-16 bottom-2 overflow-hidden">
      <div ref={inner} className={`absolute top-0 left-0 origin-top-left ${className}`} style={{ width, height }}>
        {children}
      </div>
    </div>
  );
}

// The demo's mouse pointer; the reel moves it with GSAP (x/y in screen pixels).
export function Cursor({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="pointer-events-none invisible absolute top-0 left-0 z-20" aria-hidden="true">
      <span data-ring className="absolute -top-6 -left-6 size-12 rounded-full border-2 border-white/80 opacity-0" />
      <svg data-arrow width="26" height="30" viewBox="0 0 26 30" className="origin-top-left drop-shadow-[0_2px_6px_rgb(0_0_0/0.5)]">
        <path
          d="M2 2 L2 24 L8 18.5 L12.5 28 L16.5 26.2 L12.2 17 L20 17 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Step captions, stacked in one spot at the bottom of the stage; the reel fades each one in and out.
export function Captions({ items }: { items: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-20 grid justify-items-center lg:bottom-9" aria-hidden="true">
      {items.map((c) => (
        <p
          key={c}
          data-caption
          className="invisible col-start-1 row-start-1 rounded-full border border-line bg-bg/80 px-4 py-2 text-center text-sm text-ink/90 shadow-lg backdrop-blur md:text-base"
        >
          {c}
        </p>
      ))}
    </div>
  );
}

// Blurred, darkened copy of a frame behind a fitted screen, so the stage reads as full-bleed.
export function Ambient({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop of an already-loaded frame */}
      <img src={src} alt="" className="h-full w-full scale-125 object-cover opacity-35 blur-3xl" />
      <div className="absolute inset-0 bg-bg/40" />
    </div>
  );
}
