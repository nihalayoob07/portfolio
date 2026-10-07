"use client";

import { useEffect } from "react";

// Once the page is idle, load the 3D code (which in turn fetches and decodes every print), so
// nobody waits for it when they scroll or jump to the prints. Safari has no requestIdleCallback.
export function PrintPreload() {
  useEffect(() => {
    const load = () => void import("./PrintCanvas");
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
