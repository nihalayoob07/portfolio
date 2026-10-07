"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useGSAP } from "@/lib/gsap";
import type { ModelEntry } from "@/content/models";
import { Captions, useShowcase } from "../showcase/Showcase";
import { caption, reelTimeline } from "../showcase/engine";

// three.js only loads once a print panel is a screen away.
const PrintCanvas = dynamic(() => import("./PrintCanvas"), { ssr: false });

// Timeline units the print's own motion runs over, after the panel title clears.
const STORY = 4;

const CAPTIONS: Record<string, string[]> = {
  medbox: ["Scroll to open it", "The lid swings on printed hinge pins", "Compartments inside, a fold-down handle on top"],
  "cat-clicker": ["A keyboard switch sits under the head", "Click anywhere. Then keep clicking"],
  "tissue-box": ["Made to order: any name, raised on the front", "Ribbed body, drop-in lid"],
  "z-ring": ["A printed crystal set into the ring", "One turn all the way round"],
};

const WORDS = ["CLICK!", "CLACK!", "CLICK", "TAK!", "*click*", "CLIK!", "CLICK!!"];
const COLORS = ["#ffffff", "#4f7dff", "#ff8fb1", "#ffd23f", "#93acff", "#7ef0c2"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// A comic-style "CLICK!" somewhere on the stage; spam enough and they fill it.
function spawnSfx(layer: HTMLElement) {
  const s = document.createElement("span");
  s.className = "sfx";
  s.textContent = pick(WORDS);
  s.style.left = `${6 + Math.random() * 88}%`;
  s.style.top = `${12 + Math.random() * 74}%`;
  s.style.color = pick(COLORS);
  s.style.setProperty("--r", `${-26 + Math.random() * 52}deg`);
  s.style.setProperty("--s", `${0.65 + Math.random() * 0.9}`);
  layer.append(s);
  while (layer.childElementCount > 90) layer.firstElementChild!.remove();
  window.setTimeout(() => s.remove(), 7000);
}

export function PrintStage({ model }: { model: ModelEntry }) {
  const root = useRef<HTMLDivElement>(null);
  const sfx = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const clickedAt = useRef(-1e9);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const { onScreen } = useShowcase();
  const clicker = model.slug === "cat-clicker";
  const captions = CAPTIONS[model.slug] ?? [];

  useGSAP(
    () => {
      const el = root.current!;
      const tl = reelTimeline(el);
      const o = { p: 0 };
      tl.to(
        o,
        {
          p: 1,
          duration: STORY,
          onUpdate: () => {
            progress.current = o.p;
          },
        },
        0.2,
      );
      const caps = el.querySelectorAll("[data-caption]");
      const span = (STORY - 0.6) / caps.length;
      caps.forEach((c, i) => caption(tl, c, 0.9 + i * span, 0.85 + (i + 1) * span));
    },
    { scope: root },
  );

  const click = () => {
    clickedAt.current = performance.now();
    spawnSfx(sfx.current!);
  };

  return (
    <div
      ref={root}
      className={`absolute inset-0 ${clicker ? "cursor-pointer select-none" : ""}`}
      onPointerDown={
        clicker
          ? (e) => {
              if (!(e.target as HTMLElement).closest("a, button")) click();
            }
          : undefined
      }
    >
      <PrintCanvas model={model} progress={progress} clickedAt={clickedAt} running={onScreen} onReady={onReady} />
      {!ready && (
        <p className="absolute inset-x-0 top-1/2 text-center font-mono text-xs tracking-widest text-ink/50 uppercase">Loading model</p>
      )}
      {clicker && (
        <>
          <div ref={sfx} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />
          <button
            type="button"
            onClick={click}
            className="absolute top-24 right-5 rounded-full border border-line bg-bg/70 px-4 py-2 font-mono text-xs tracking-widest text-ink/80 uppercase backdrop-blur hover:border-accent md:right-8"
          >
            Click anywhere
          </button>
        </>
      )}
      <Captions items={captions} />
    </div>
  );
}
