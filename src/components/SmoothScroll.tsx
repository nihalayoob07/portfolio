"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, MOTION } from "@/lib/gsap";

let active: Lenis | null = null;

// Pauses page scrolling while an overlay (like the project preview) is open.
export function setPageScrollLocked(locked: boolean) {
  if (locked) active?.stop();
  else active?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync.
export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia(MOTION).matches) return;
    const lenis = new Lenis({ anchors: { offset: -64 }, autoRaf: false });
    active = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      active = null;
    };
  }, []);
  return null;
}
