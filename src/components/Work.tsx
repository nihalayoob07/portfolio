"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { projects, type Project } from "@/content/projects";
import { gsap, useGSAP, DESKTOP_MOTION } from "@/lib/gsap";
import { ProjectPoster } from "./ProjectPoster";
import { DeckDemo } from "./previews/DeckDemo";
import { PhonePreview } from "./previews/PhonePreview";
import { PreviewDialog } from "./previews/PreviewDialog";
import { AppPreview, PagePreview } from "./previews/SitePreviews";

function ProjectMedia({ project, onExpand }: { project: Project; onExpand: () => void }) {
  const p = project.preview;
  switch (p.kind) {
    case "page":
      return <PagePreview preview={p} title={project.title} onExpand={onExpand} />;
    case "app":
      return <AppPreview preview={p} title={project.title} onExpand={onExpand} />;
    case "phone":
      return <PhonePreview screens={p.screens} title={project.title} />;
    case "deck":
      return <DeckDemo />;
    case "poster":
      return <ProjectPoster kind={p.poster} />;
  }
}

function ProjectCard({ project, index, onExpand }: { project: Project; index: number; onExpand: (p: Project) => void }) {
  return (
    <article className="flex w-full shrink-0 flex-col border-t border-line px-5 py-10 md:px-10 lg:h-full lg:w-[min(40rem,42vw)] lg:border-t-0 lg:border-l lg:py-6">
      <div className="flex items-start justify-between gap-4">
        <span className="display text-5xl lg:text-6xl">{String(index + 1).padStart(2, "0")}</span>
        <div className="text-right">
          <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{project.title}</h3>
          <p className="mt-1 text-sm text-muted">{project.category}</p>
        </div>
      </div>

      <p className="mt-5 text-sm font-medium">Tools and features</p>
      <p className="mt-1 text-sm text-muted">{project.stack.join(", ")}</p>

      {/* Fills the card's spare height on desktop; phones get a taller box for the portrait screens. */}
      <div
        className={`relative mt-5 w-full overflow-hidden rounded-lg border border-line lg:aspect-auto lg:min-h-52 lg:flex-1 ${
          project.preview.kind === "phone" ? "aspect-[4/5] sm:aspect-[16/10]" : "aspect-[16/10]"
        }`}
      >
        <ProjectMedia project={project} onExpand={() => onExpand(project)} />
      </div>

      <p className="mt-5 leading-relaxed text-ink/85">{project.summary}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted [@media(min-width:1024px)_and_(max-height:780px)]:hidden">
        {project.highlights.map((h) => (
          <li key={h} className="flex gap-3">
            <span className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
            {h}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-sm">
        {project.status && (
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-ink/60 uppercase">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_rgb(79_125_255)]" aria-hidden="true" />
            {project.status}
          </span>
        )}
        {project.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent-soft hover:text-ink"
          >
            {l.label}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        ))}
        {project.privateRepo && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" aria-hidden="true" /> Private repo
          </span>
        )}
      </div>
    </article>
  );
}

export function Work() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Project | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(DESKTOP_MOTION, () => {
        const pinEl = pin.current!;
        const trackEl = track.current!;
        // While pinned, the track moves sideways, so drop the native scrollbar fallback.
        pinEl.style.overflowX = "hidden";
        const distance = () => Math.max(0, trackEl.scrollWidth - pinEl.clientWidth);
        gsap.to(trackEl, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pinEl,
            pin: true,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          pinEl.style.overflowX = "";
        };
      });
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} className="relative z-10" aria-labelledby="work-title">
      <div ref={pin} className="flex flex-col lg:h-screen lg:overflow-x-auto lg:pt-20">
        <h2
          id="work-title"
          className="px-5 pt-24 pb-10 text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-tight md:px-10 lg:pt-4 lg:pb-8 lg:pl-30"
        >
          My <span className="text-accent">work</span>
        </h2>
        <div ref={track} className="flex flex-col border-y border-line lg:min-h-0 lg:flex-1 lg:flex-row lg:border-b-0 lg:pl-20">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} onExpand={setExpanded} />
          ))}
          <div className="flex w-full shrink-0 flex-col justify-center gap-4 border-t border-line px-5 py-16 md:px-10 lg:w-[min(30rem,32vw)] lg:border-t-0 lg:border-l">
            <p className="text-3xl font-medium tracking-tight">Want to see more?</p>
            <p className="text-muted">Public code and experiments live on GitHub.</p>
            <a
              href="https://github.com/nihalayoob07"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-accent hover:text-accent-soft"
            >
              github.com/nihalayoob07 <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
      <PreviewDialog project={expanded} onClose={() => setExpanded(null)} />
    </section>
  );
}
