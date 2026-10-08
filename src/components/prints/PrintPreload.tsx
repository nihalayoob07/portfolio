"use client";

import { useEffect } from "react";
import { isLite } from "@/lib/device";
import { warm } from "./warm";

// Once the page is idle, load the 3D code (which in turn fetches and decodes every print), then
// start warming the prints up, so nobody waits for them when they scroll or jump there.
// Safari has no requestIdleCallback.
export function PrintPreload() {
  useEffect(() => {
    // Phones don't warm anything up: the 3D code loads once the prints are a couple of screens
    // away, and each print loads and mounts near its own panel (see PrintStage).
    if (isLite()) {
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          void import("./PrintCanvas");
        },
        { rootMargin: "200% 0px" },
      );
      io.observe(document.getElementById("models")!);
      return () => io.disconnect();
    }
    const load = () => void import("./PrintCanvas").then(() => warm.start());
    const idle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    if (idle) {
      const id = idle(load, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(load, 2000);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
