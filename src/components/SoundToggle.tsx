"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sfx";

const LABEL = { locked: "Tap for sound", on: "Sound on", muted: "Sound off" };

// Turns the page's sound effects on and off (the first tap also unlocks audio in the browser).
// "pill" sits in a panel; "nav" matches the header links.
export function SoundToggle({ variant = "pill", className = "" }: { variant?: "pill" | "nav"; className?: string }) {
  const state = useSyncExternalStore(sound.subscribe, sound.state, () => "locked" as const);
  const Icon = state === "on" ? Volume2 : VolumeX;
  if (variant === "nav")
    return (
      <button
        type="button"
        onClick={sound.toggle}
        aria-pressed={state === "on"}
        aria-label={LABEL[state]}
        className={`flex items-center gap-1.5 hover:text-accent-soft ${state === "on" ? "" : "text-ink/60"} ${className}`}
      >
        <Icon className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">Sound</span>
      </button>
    );
  return (
    <button
      type="button"
      onClick={sound.toggle}
      aria-pressed={state === "on"}
      className={`flex items-center gap-2 rounded-full border border-line bg-bg/75 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:border-accent ${
        state === "locked" ? "text-ink shadow-[0_0_24px_rgb(46_230_166/0.35)]" : "text-ink/75"
      } ${className}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {LABEL[state]}
    </button>
  );
}
