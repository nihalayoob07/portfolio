"use client";

import { gsap } from "@/lib/gsap";
import { mouseClick } from "@/lib/sfx";

// Timeline units the shared intro takes before a reel's own story starts.
export const INTRO = 0.8;

// A reel's master timeline, scrubbed by its showcase panel. The panel's big title
// fades out first and its corner label comes in; the reel appends its story after INTRO.
export function reelTimeline(root: HTMLElement) {
  const article = root.closest<HTMLElement>("[data-showcase]")!;
  const q = gsap.utils.selector(article);
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: article, start: "top top", end: "bottom bottom", scrub: 0.6 },
  });
  tl.to(q("[data-intro]"), { autoAlpha: 0, y: -60, duration: INTRO * 0.7, ease: "power1.in" }, 0.1)
    .to(q("[data-dim]"), { opacity: 0, duration: INTRO * 0.7 }, 0.1)
    .fromTo(q("[data-label]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3 }, INTRO * 0.6);
  return tl;
}

// Shows a caption between two points of the timeline.
export function caption(tl: gsap.core.Timeline, el: Element, from: number, to: number) {
  tl.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.12 }, from).to(el, { autoAlpha: 0, y: -12, duration: 0.12 }, to);
}

export function moveTo(tl: gsap.core.Timeline, cursor: Element, x: number, y: number, at: number, duration = 0.4) {
  tl.to(cursor, { x, y, duration, ease: "power2.inOut" }, at);
}

// Plays the demo mouse's click sound as the playhead passes `at`, only when scrolling forward.
export function clickSound(tl: gsap.core.Timeline, at: number, down = true) {
  tl.call(
    () => {
      if ((tl.scrollTrigger?.direction ?? 1) > 0) mouseClick(down);
    },
    [],
    at,
  );
}

// A click: the arrow dips, a ring spreads from its tip and the mouse clicks. `set` + `to` so
// scrubbing back undoes it.
export function click(tl: gsap.core.Timeline, cursor: Element, at: number) {
  const ring = cursor.querySelector("[data-ring]");
  const arrow = cursor.querySelector("[data-arrow]");
  clickSound(tl, at);
  tl.set(ring, { scale: 0.2, opacity: 0.8 }, at)
    .to(ring, { scale: 1.6, opacity: 0, duration: 0.2, ease: "power1.out" }, at)
    .to(arrow, { scale: 0.86, duration: 0.05 }, at)
    .to(arrow, { scale: 1, duration: 0.08 }, at + 0.05);
}

export function fadeIn(tl: gsap.core.Timeline, el: Element | null, at: number, duration = 0.15) {
  tl.to(el, { opacity: 1, duration }, at);
}

// Types `text` into `el` as the timeline passes; `shown` toggles whatever hides a placeholder.
export function typeText(
  tl: gsap.core.Timeline,
  el: Element,
  text: string,
  at: number,
  duration: number,
  shown?: (typing: boolean) => void,
) {
  const o = { n: 0 };
  tl.to(
    o,
    {
      n: text.length,
      duration,
      onUpdate: () => {
        const n = Math.round(o.n);
        el.textContent = text.slice(0, n);
        shown?.(n > 0);
      },
    },
    at,
  );
}
