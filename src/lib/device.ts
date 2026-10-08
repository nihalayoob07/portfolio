"use client";

import { useSyncExternalStore } from "react";

// Phones and tablets (touch-first or narrow screens) get the light version of the heavy parts:
// smaller demo frames, cheaper 3D mounted only near its panel, and no backdrop blurs.
export const LITE = "(pointer: coarse), (max-width: 767px)";

export const isLite = () => window.matchMedia(LITE).matches;

export function useLite() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(LITE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    isLite,
    () => false,
  );
}
