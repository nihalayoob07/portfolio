"use client";

import { useEffect } from "react";
import { warm } from "./warm";

// Once the page is idle, load the 3D code (which in turn fetches and decodes every print), then
// start warming the prints up, so nobody waits for them when they scroll or jump there.
// Safari has no requestIdleCallback.
export function PrintPreload() {
  useEffect(() => {
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
