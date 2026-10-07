"use client";

import { Maximize2, Play } from "lucide-react";
import type { Preview } from "@/content/projects";
import { BrowserFrame } from "./BrowserFrame";

type Page = Extract<Preview, { kind: "page" }>;
type App = Extract<Preview, { kind: "app" }>;

// A full-page capture that slowly pans to the bottom while hovered; the expand button opens it at full size.
export function PagePreview({ preview, title, onExpand }: { preview: Page; title: string; onExpand: () => void }) {
  return (
    <BrowserFrame
      url={preview.url}
      action={
        <button type="button" onClick={onExpand} aria-label={`Expand ${title}`} className="rounded p-1 text-ink/60 hover:text-ink">
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </button>
      }
    >
      <button
        type="button"
        onClick={onExpand}
        className="group/page absolute inset-0 cursor-zoom-in"
        aria-label={`Open the full ${title} page`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- one tall capture, panned with object-position */}
        <img
          src={preview.src}
          alt={`${title}, full page`}
          width={preview.width}
          height={preview.height}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-[object-position] duration-1000 ease-out group-hover/page:object-bottom group-hover/page:duration-[9000ms] group-hover/page:ease-linear motion-reduce:transition-none"
        />
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-bg/80 px-3 py-1 font-mono text-[10px] tracking-widest text-ink/70 uppercase backdrop-blur group-hover/page:opacity-0">
          Hover to scroll
        </span>
      </button>
    </BrowserFrame>
  );
}

// A capture of a web app with a button that runs the real thing in the expanded view.
export function AppPreview({ preview, title, onExpand }: { preview: App; title: string; onExpand: () => void }) {
  return (
    <BrowserFrame url={preview.url}>
      <button type="button" onClick={onExpand} className="group/app absolute inset-0" aria-label={`Try ${title} live`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static capture shown until the live app is opened */}
        <img
          src={preview.poster.src}
          alt={`${title} screenshot`}
          width={preview.poster.width}
          height={preview.poster.height}
          loading="lazy"
          className="h-full w-full object-cover object-top transition duration-500 group-hover/app:scale-[1.02] group-hover/app:opacity-60"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgb(79_125_255)] transition group-hover/app:scale-105">
            <Play className="size-4 fill-current" aria-hidden="true" /> Try it live
          </span>
        </span>
      </button>
    </BrowserFrame>
  );
}
