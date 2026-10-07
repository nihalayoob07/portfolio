"use client";

import { useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sfx";

const ASKED = "sfx-asked";

// Asks once per visit whether to play sound. Either answer is a click, which is also what the
// browser needs before it lets the page make any sound at all.
export function SoundPrompt() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ASKED)) return;
    } catch {
      /* no storage: ask anyway */
    }
    dialog.current!.showModal();
    // Hold the page still behind it (Lenis ignores wheel events inside [data-lenis-prevent]).
    document.documentElement.style.overflow = "hidden";
  }, []);

  const answer = (on: boolean) => {
    sound.set(on);
    try {
      sessionStorage.setItem(ASKED, "1");
    } catch {
      /* asked again next load, harmless */
    }
    document.documentElement.style.overflow = "";
    dialog.current!.close();
  };

  return (
    <dialog
      ref={dialog}
      data-lenis-prevent
      aria-labelledby="sound-title"
      onCancel={(e) => {
        e.preventDefault();
        answer(false);
      }}
      className="m-auto w-[min(40rem,calc(100%-2.5rem))] overflow-visible bg-transparent text-ink backdrop:bg-bg/80 backdrop:backdrop-blur-xl open:animate-[sound-in_0.5s_cubic-bezier(0.2,1,0.3,1)]"
    >
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface/90 px-7 py-10 text-center shadow-[0_40px_160px_rgb(79_125_255/0.25)] md:px-14 md:py-14">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex h-14 items-end justify-center gap-1.5" aria-hidden="true">
          {[0.9, 0.5, 1, 0.65, 0.8, 0.45, 0.95].map((h, i) => (
            <span
              key={i}
              className="sound-bar w-2 rounded-full bg-accent"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }}
            />
          ))}
        </div>
        <h2 id="sound-title" className="display relative mt-8 text-[clamp(3rem,9vw,6rem)]">
          Sound on?
        </h2>
        <p className="relative mx-auto mt-5 max-w-md text-base leading-relaxed text-ink/75 md:text-lg">
          An alarm that rings, a keyboard switch you can click and a demo mouse that clicks along. Nothing loud.
        </p>
        <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            autoFocus
            onClick={() => answer(true)}
            className="flex items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_40px_rgb(79_125_255/0.5)] transition hover:scale-[1.03] active:scale-95"
          >
            <Volume2 className="size-5" aria-hidden="true" /> Turn sound on
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            className="flex items-center justify-center gap-2.5 rounded-full border border-line px-8 py-4 text-lg font-semibold text-ink/80 transition hover:border-ink/40 hover:text-ink"
          >
            <VolumeX className="size-5" aria-hidden="true" /> Keep it quiet
          </button>
        </div>
        <p className="relative mt-6 text-sm text-muted">You can change this any time from Sound in the menu bar.</p>
      </div>
    </dialog>
  );
}
