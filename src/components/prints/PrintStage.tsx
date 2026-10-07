"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MousePointerClick } from "lucide-react";
import { useGSAP } from "@/lib/gsap";
import type { ModelEntry } from "@/content/models";
import { Captions, useShowcase, type Caption, type CaptionPlace } from "../showcase/Showcase";
import { caption, reelTimeline } from "../showcase/engine";

// three.js only loads once a print panel is a screen away.
const PrintCanvas = dynamic(() => import("./PrintCanvas"), { ssr: false });

// Timeline units the print's own motion runs over, after the panel title clears.
const STORY = 4;

// Captions per print and where they go. `aside` frames the print left of centre to make room
// for a caption column; the rest stay centred.
const STAGES: Record<string, { captions: Caption[]; place?: CaptionPlace; aside?: boolean }> = {
  medbox: {
    place: "edge",
    captions: [
      ["Scroll to open"],
      ["Printed hinge", "The lid swings on printed pins"],
      ["Room inside", "Compartments, and a fold-down handle on top"],
    ],
  },
  "cat-clicker": { captions: [] },
  "tissue-box": {
    aside: true,
    captions: [
      ["Customisable tissue box", "Made to order"],
      ["Your name on it", "Raised lettering across the ribbed front"],
    ],
  },
  "z-ring": { captions: [] },
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
  const stage = STAGES[model.slug] ?? { captions: [] };

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
      <PrintCanvas model={model} progress={progress} clickedAt={clickedAt} running={onScreen} aside={!!stage.aside} onReady={onReady} />
      {!ready && (
        <p className="absolute inset-x-0 top-1/2 text-center font-mono text-xs tracking-widest text-ink/50 uppercase">Loading model</p>
      )}
      {clicker && (
        <>
          <div ref={sfx} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />
          <button
            type="button"
            onClick={click}
            className="absolute top-22 right-5 flex items-center gap-2.5 rounded-full bg-accent px-6 py-3.5 text-sm font-bold tracking-[0.16em] text-white uppercase shadow-[0_0_0_6px_rgb(79_125_255/0.18),0_10px_40px_rgb(79_125_255/0.55)] transition hover:scale-105 active:scale-95 md:right-8 md:text-base"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-accent/40 [animation-duration:1.8s]" aria-hidden="true" />
            <MousePointerClick className="relative size-5" aria-hidden="true" />
            <span className="relative">Click anywhere</span>
          </button>
        </>
      )}
      <Captions items={stage.captions} place={stage.place} />
    </div>
  );
}
