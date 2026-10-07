"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ModelEntry } from "@/content/models";

const QUIPS = [
  "Heating the nozzle to 220 °C",
  "Levelling the bed. Again.",
  "Slicing into 0.2 mm layers",
  "Purging the first blob",
  "Laying layer one, the one that matters",
  "Don't look away, this is the good bit",
  "Retracting, un-stringing, carrying on",
  "Almost there. The fans are loud now",
];

// While a print's model loads, a little printer builds it from the bed up: the part's silhouette
// (from Bambu's plate render) fills in layer by layer under a gantry and nozzle, with a real layer
// count (0.2 mm layers over its height) and a running commentary. `progress` is the model
// download, 0–100; before the 3D code has even arrived it creeps on its own.
export function PrintLoader({ model, progress, done }: { model: ModelEntry; progress: number; done: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (done) return;
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(performance.now() - start), 120);
    return () => window.clearInterval(id);
  }, [done]);

  const p = Math.min(100, Math.max(progress, Math.min(24, (elapsed / 2600) * 24)));
  const layers = Math.round(model.size[2] / 0.2);
  const quip = QUIPS[Math.floor(elapsed / 1700) % QUIPS.length];
  // The part as a silhouette, so dark and light prints read the same.
  const mask: CSSProperties = model.thumb
    ? {
        maskImage: `url(${model.thumb})`,
        WebkitMaskImage: `url(${model.thumb})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center bottom",
        WebkitMaskPosition: "center bottom",
      }
    : {};

  return (
    <div
      data-loader
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 transition-opacity duration-700 ${done ? "opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
      aria-label={done ? `${model.title} loaded` : `Loading ${model.title}, ${Math.round(p)}%`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Build volume: rails, the part, the gantry riding at the current layer, and a hot bed. */}
        <div className="relative h-[min(30vh,15rem)] w-[min(34vh,17rem)]" aria-hidden="true">
          <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-ink/20 to-ink/30" />
          <div className="absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-ink/20 to-ink/30" />
          <div className="absolute inset-x-5 top-3 bottom-3">
            <div className="absolute inset-0 bg-ink/[0.07]" style={mask} />
            <div className="absolute inset-0" style={{ clipPath: `inset(${100 - p}% 0 0 0)` }}>
              <div
                className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_2px,rgb(10_10_12/0.35)_2px_3px),linear-gradient(to_top,#4f7dff,#93acff_55%,#eef1ff)]"
                style={mask}
              />
            </div>
          </div>
          <div
            className="absolute inset-x-0 transition-[top] duration-300"
            style={{ top: `calc(0.75rem + ${(100 - p) / 100} * (100% - 1.5rem))` }}
          >
            <div className="absolute inset-x-0 -top-px h-0.5 rounded-full bg-ink/25" />
            <div className="absolute inset-x-5 h-px bg-accent-soft shadow-[0_0_10px_#93acff]" />
            <div className="print-nozzle">
              <span className="block h-4 w-6 rounded-md bg-ink/90 shadow-[inset_0_-2px_0_rgb(0_0_0/0.25)]" />
              <span className="mx-auto block h-2 w-2.5 bg-ink/80 [clip-path:polygon(0_0,100%_0,65%_100%,35%_100%)]" />
              <span className="mx-auto -mt-px block size-1.5 rounded-full bg-[#ff8a3d] shadow-[0_0_8px_3px_#ff8a3d]" />
            </div>
          </div>
          <div className="absolute inset-x-2 -bottom-1 h-1.5 rounded-full bg-linear-to-r from-ink/10 via-ink/30 to-ink/10" />
          <div className="absolute inset-x-6 -bottom-6 h-6 rounded-full bg-[#ff8a3d]/15 blur-xl" />
        </div>

        <p className="display mt-10 text-[clamp(3.5rem,9vw,6.5rem)] tabular-nums">
          {Math.round(p)}
          <span className="text-accent">%</span>
        </p>
        <p className="mt-3 font-mono text-sm text-ink/85 md:text-base">{quip}</p>
        <p className="mt-2 font-mono text-xs text-ink/45 tabular-nums">
          Printing {model.title.toLowerCase()} · layer {Math.round((p / 100) * layers)} of {layers}
        </p>
      </div>
    </div>
  );
}
