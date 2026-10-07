"use client";

// Warms the 3D prints up one at a time, in panel order, long before anyone scrolls to them:
// PrintPreload starts the queue once the 3D code has loaded, and each print lets the next one
// start as soon as it has drawn its first frame. `allowed` is how many may have a live canvas.
let allowed = 0;
const live = new Set<number>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

export const warm = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  allowed: () => allowed,
  start() {
    if (allowed === 0) {
      allowed = 1;
      emit();
    }
  },
  // Print `index` is live. Let the next one start, skipping any that went live out of turn
  // (someone landed on them first).
  done(index: number) {
    live.add(index);
    let moved = false;
    while (allowed > 0 && live.has(allowed - 1)) {
      allowed++;
      moved = true;
    }
    if (moved) emit();
  },
};
