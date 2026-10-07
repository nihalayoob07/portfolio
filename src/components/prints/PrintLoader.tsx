"use client";

import { useEffect, useState } from "react";
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

// While a print's model loads, a small 3D printer builds its picture layer by layer from the bed
// up, with a real layer count (0.2 mm layers over its height) and a running commentary.
// `progress` is the model download, 0–100; before the 3D code has even arrived it creeps on its own.
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

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center px-5 transition-opacity duration-500 ${done ? "opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
      aria-label={done ? `${model.title} loaded` : `Loading ${model.title}, ${Math.round(p)}%`}
    >
      <div className="flex w-[min(30rem,100%)] items-center gap-5 rounded-2xl border border-line bg-bg/85 p-4 pr-6 shadow-2xl backdrop-blur-md">
        {/* The build plate: ghost of the part, the printed share of it, and the nozzle on the current layer. */}
        <div className="relative size-24 shrink-0">
          {model.thumb && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny Bambu plate render */}
              <img src={model.thumb} alt="" className="absolute inset-0 h-full w-full object-contain opacity-[0.16] grayscale" />
              <div className="absolute inset-0" style={{ clipPath: `inset(${100 - p}% 0 0 0)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny Bambu plate render */}
                <img
                  src={model.thumb}
                  alt=""
                  className="h-full w-full object-contain [filter:brightness(1.25)_drop-shadow(0_0_10px_rgb(79_125_255/0.45))]"
                />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_2px,rgb(0_0_0/0.22)_2px_3px)]" />
              </div>
            </>
          )}
          <div className="absolute inset-x-0" style={{ top: `${100 - p}%` }} aria-hidden="true">
            <div className="absolute inset-x-1 h-px bg-accent-soft shadow-[0_0_8px_#93acff]" />
            <div className="print-nozzle">
              <span className="block h-2.5 w-3.5 rounded-t-sm bg-ink/85" />
              <span className="mx-auto block h-1.5 w-1.5 bg-ink/85 [clip-path:polygon(0_0,100%_0,60%_100%,40%_100%)]" />
              <span className="mx-auto -mt-0.5 block size-1 rounded-full bg-[#ff8a3d] shadow-[0_0_6px_2px_#ff8a3d]" />
            </div>
          </div>
          <div className="absolute inset-x-0 -bottom-1.5 h-1 rounded-full bg-ink/15" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 font-mono">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-xs text-ink/85">{quip}</p>
            <p className="text-sm font-semibold text-accent-soft tabular-nums">{Math.round(p)}%</p>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${p}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-ink/50 tabular-nums">
            Printing {model.title.toLowerCase()} · layer {Math.round((p / 100) * layers)} of {layers}
          </p>
        </div>
      </div>
    </div>
  );
}
