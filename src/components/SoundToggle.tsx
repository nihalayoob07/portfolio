"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sfx";

const LABEL = { locked: "Tap for sound", on: "Sound on", muted: "Sound off" };

// Turns the page's sound effects on and off (the first tap also unlocks audio in the browser).
export function SoundToggle({ className = "" }: { className?: string }) {
  const state = useSyncExternalStore(sound.subscribe, sound.state, () => "locked" as const);
  const Icon = state === "on" ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      onClick={sound.toggle}
      aria-pressed={state === "on"}
      className={`flex items-center gap-2 rounded-full border border-line bg-bg/75 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:border-accent ${
        state === "locked" ? "text-ink shadow-[0_0_24px_rgb(79_125_255/0.35)]" : "text-ink/75"
      } ${className}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {LABEL[state]}
    </button>
  );
}
