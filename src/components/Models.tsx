"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, RotateCcw } from "lucide-react";
import { models } from "@/content/models";
import { gsap, useGSAP, MOTION } from "@/lib/gsap";

// three.js only loads once the section is near the viewport.
const ModelCanvas = dynamic(() => import("./ModelCanvas"), { ssr: false, loading: () => <ViewerPlaceholder /> });

function ViewerPlaceholder() {
  return (
    <div className="grid h-full place-items-center text-muted">
      <Box className="size-8 animate-pulse" aria-hidden="true" />
    </div>
  );
}

const fmt = new Intl.NumberFormat("en-US");
const mm = (n: number) => `${Math.round(n)}`;

export function Models() {
  const root = useRef<HTMLElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [explode, setExplode] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const model = models[active];
  const others = useMemo(() => models.filter((_, i) => i !== active).map((m) => m.glb), [active]);

  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const nearObs = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "900px 0px" });
    const seenObs = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    nearObs.observe(el);
    seenObs.observe(el);
    return () => {
      nearObs.disconnect();
      seenObs.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const m = gsap.matchMedia();
      m.add(MOTION, () => {
        gsap.from("[data-models-reveal]", {
          y: 50,
          opacity: 0,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
      });
    },
    { scope: root },
  );

  const [w, d, h] = model.size;
  // On touch screens pinch-zoom is harmless; with a mouse, wheel-zoom waits for a click so page scrolling isn't hijacked.
  const zoomOn = coarse || zoom;

  return (
    <section id="models" ref={root} className="relative z-10 px-5 py-24 md:px-10 md:py-32" aria-labelledby="models-title">
      <div className="mx-auto max-w-7xl">
        <div data-models-reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="models-title" className="text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-tight">
            3D <span className="text-accent">models</span>
          </h2>
          <p className="max-w-sm text-muted">
            Designed in CAD, sliced in Bambu Studio, then printed and tested by me. Drag any model to turn it around.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div
            data-models-reveal
            ref={viewer}
            data-lenis-prevent={zoomOn && !coarse ? "" : undefined}
            onPointerDown={() => setZoom(true)}
            onPointerLeave={() => setZoom(false)}
            className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface sm:aspect-[4/3] lg:aspect-auto lg:h-[min(72vh,44rem)]"
            role="region"
            aria-label={`Interactive 3D view of the ${model.title}`}
          >
            {near ? (
              <ModelCanvas
                url={model.glb}
                size={model.size}
                wireframe={wireframe}
                explode={explode}
                zoom={zoomOn}
                running={onScreen}
                resetKey={resetKey}
                preload={others}
              />
            ) : (
              <ViewerPlaceholder />
            )}

            <div className="pointer-events-none absolute top-0 left-0 p-4 md:p-5">
              <p className="text-lg font-semibold">{model.title}</p>
              <p className="mt-0.5 font-mono text-[11px] tracking-wider text-ink/45 uppercase">
                {coarse ? "Drag to turn · pinch to zoom" : zoom ? "Scroll to zoom" : "Drag to turn · click, then scroll to zoom"}
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 md:p-5">
              <p className="pointer-events-none font-mono text-[11px] tracking-wider text-ink/60 uppercase">
                {model.assembled ? "Assembled" : "Print layout"} · {mm(w)} × {mm(d)} × {mm(h)} mm
              </p>
              <div className="flex items-center gap-2 rounded-full border border-line bg-bg/70 py-1.5 pr-1.5 pl-4 backdrop-blur">
                <label className="flex items-center gap-3 font-mono text-[11px] tracking-wider text-ink/70 uppercase">
                  Explode
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={explode}
                    onChange={(e) => setExplode(Number(e.target.value))}
                    className="w-24 accent-accent sm:w-32"
                  />
                </label>
                <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
                <button
                  type="button"
                  aria-pressed={wireframe}
                  onClick={() => setWireframe((v) => !v)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[11px] tracking-wider uppercase transition ${wireframe ? "bg-accent text-white" : "text-ink/70 hover:text-ink"}`}
                >
                  Mesh
                </button>
                <button
                  type="button"
                  aria-label="Reset view"
                  onClick={() => setResetKey((k) => k + 1)}
                  className="rounded-full p-1.5 text-ink/70 hover:text-ink"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div data-models-reveal className="flex flex-col gap-4">
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {models.map((m, i) => (
                <li key={m.slug}>
                  <button
                    type="button"
                    aria-pressed={i === active}
                    onClick={() => {
                      setActive(i);
                      setExplode(0);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                      i === active ? "border-accent bg-accent/[0.06]" : "border-line hover:border-ink/25"
                    }`}
                  >
                    {m.thumb && (
                      // Bambu Studio's own plate render, already small.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.thumb} alt="" width={56} height={56} className="size-14 shrink-0 rounded-lg bg-raised object-contain" />
                    )}
                    <span className="min-w-0">
                      <span className="block leading-tight font-medium">{m.title}</span>
                      <span className="block text-xs text-muted">
                        {m.parts} {m.parts === 1 ? "part" : "parts"} · {m.plates} {m.plates === 1 ? "plate" : "plates"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-line p-5">
              <p className="leading-relaxed text-ink/85">{model.blurb}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted">Parts</dt>
                  <dd className="font-medium">{model.parts}</dd>
                </div>
                <div>
                  <dt className="text-muted">Print plates</dt>
                  <dd className="font-medium">{model.plates}</dd>
                </div>
                <div>
                  <dt className="text-muted">{model.assembled ? "Assembled size" : "Print layout"}</dt>
                  <dd className="font-medium">
                    {mm(w)} × {mm(d)} × {mm(h)} mm
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Triangles</dt>
                  <dd className="font-medium">{fmt.format(model.sourceTriangles)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
