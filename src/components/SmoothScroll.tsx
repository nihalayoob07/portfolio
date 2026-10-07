"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, MOTION } from "@/lib/gsap";

// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync, and reloads
// that always start at the top.
export function SmoothScroll() {
  useEffect(() => {
    // A reload starts at the top, rather than where the page was left or at a #section.
    history.scrollRestoration = "manual";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo(0, 0);

    if (!window.matchMedia(MOTION).matches) return;
    // Anchor links jump rather than glide, so the menu doesn't play every reel on the way.
    const lenis = new Lenis({ anchors: { offset: -64, immediate: true }, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
