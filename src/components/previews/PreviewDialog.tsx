"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";
import type { Project } from "@/content/projects";
import { setPageScrollLocked } from "../SmoothScroll";
import { BrowserFrame } from "./BrowserFrame";

// Full-size view for site and web-app previews: the whole page to scroll, or the app running live.
export function PreviewDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = project?.preview;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (project && !el.open) {
      el.showModal();
      setPageScrollLocked(true);
    }
    if (!project && el.open) el.close();
  }, [project]);

  const external = preview?.kind === "page" ? `https://${preview.url}` : preview?.kind === "app" ? preview.src : project?.links[0]?.href;

  return (
    <dialog
      ref={dialog}
      data-lenis-prevent
      aria-label={project ? `${project.title} preview` : "Project preview"}
      onClose={() => {
        setPageScrollLocked(false);
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-auto h-[min(88vh,60rem)] w-[min(94vw,80rem)] max-w-none overflow-hidden rounded-2xl border border-line bg-bg p-0 text-ink backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      {project && (preview?.kind === "page" || preview?.kind === "app") && (
        <BrowserFrame
          url={preview.url}
          action={
            <div className="flex items-center gap-1">
              {external && (
                <a
                  href={external}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-ink/60 hover:text-ink"
                >
                  Open in a new tab <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                aria-label="Close preview"
                className="rounded p-1 text-ink/70 hover:text-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          }
        >
          {preview.kind === "page" ? (
            <div className="absolute inset-0 overflow-y-auto overscroll-contain">
              {/* eslint-disable-next-line @next/next/no-img-element -- the same capture, shown at full width to scroll */}
              <img src={preview.src} alt={`${project.title}, full page`} width={preview.width} height={preview.height} className="w-full" />
            </div>
          ) : (
            // The demo is our own build and needs localStorage, so it keeps same-origin; the sandbox still blocks top-level navigation.
            <iframe
              src={preview.src}
              title={`${project.title} live demo`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups"
              className="absolute inset-0 h-full w-full bg-[#0f1016]"
            />
          )}
        </BrowserFrame>
      )}
    </dialog>
  );
}
