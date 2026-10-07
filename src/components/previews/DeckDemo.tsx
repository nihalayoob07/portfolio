"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ImageIcon } from "lucide-react";

// Deck's notch, driven by captures of its real UI (renderer screenshots from scripts/shots.js).
// All positions are percentages of the 850 × 314 capture.
type State = "idle" | "hover" | "modules" | "files" | "dragAway" | "dragOver" | "sent";

const SHOTS: Partial<Record<State, string>> = {
  hover: "/work/deck/2-hover.webp",
  modules: "/work/deck/3-expanded.webp",
  files: "/work/deck/4-files.webp",
  dragAway: "/work/deck/7-drop.webp",
  dragOver: "/work/deck/6-drag-over-open-panel.webp",
  sent: "/work/deck/8-toast.webp",
};

const HINT: Record<State, string> = {
  idle: "Hover or tap the notch",
  hover: "Click to open it",
  modules: "Try Files, or drag the photo up",
  files: "Drag the photo onto the notch",
  dragAway: "Bring it up to the notch",
  dragOver: "Let go to send",
  sent: "Sent to the phone",
};

export function DeckDemo() {
  const [state, setState] = useState<State>("idle");
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const open = state === "modules" || state === "files";

  useEffect(() => {
    if (state !== "sent") return;
    const id = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(id);
  }, [state]);

  // The drop zone is the notch area at the top centre of the screen.
  const overNotch = (clientX: number, clientY: number) => {
    const r = screen.current?.getBoundingClientRect();
    if (!r) return false;
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    return x > 0.2 && x < 0.8 && y < 0.42;
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointers can't be captured; the drag still works while over the button */
    }
    start.current = { x: e.clientX, y: e.clientY };
    setOffset({ x: 0, y: 0 });
    setState("dragAway");
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
    setState(overNotch(e.clientX, e.clientY) ? "dragOver" : "dragAway");
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const moved = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6;
    start.current = null;
    setOffset(null);
    // A plain click (or Enter) on the file sends it too, so the demo works without dragging.
    setState(!moved || overNotch(e.clientX, e.clientY) ? "sent" : "idle");
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[linear-gradient(160deg,#1b2232,#0c0e15_70%)] select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && open) setState("idle");
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:18px_18px] opacity-40"
        aria-hidden="true"
      />

      <div ref={screen} className="absolute inset-x-0 top-0 mx-auto aspect-[850/314] w-full max-w-[34rem]">
        {/* Collapsed notch is drawn; every other state is a real capture. */}
        <div
          className={`absolute top-0 left-1/2 h-[3.4%] w-[16%] -translate-x-1/2 rounded-b-lg bg-black transition-opacity duration-150 ${state === "idle" ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />
        {(Object.keys(SHOTS) as State[]).map((s) => (
          // eslint-disable-next-line @next/next/no-img-element -- tiny transparent UI captures, swapped by opacity
          <img
            key={s}
            src={SHOTS[s]}
            alt=""
            draggable={false}
            className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-150 ${state === s ? "opacity-100" : "opacity-0"}`}
          />
        ))}

        {(state === "idle" || state === "hover") && (
          <button
            type="button"
            aria-label="Open Deck's notch"
            className="absolute top-0 left-[30%] h-[16%] w-[40%] cursor-pointer"
            onPointerEnter={() => setState("hover")}
            onPointerLeave={() => setState((s) => (s === "hover" ? "idle" : s))}
            onFocus={() => setState("hover")}
            onClick={() => setState("modules")}
          />
        )}
        {open && (
          <>
            <button
              type="button"
              aria-label="Modules tab"
              aria-pressed={state === "modules"}
              className="absolute top-[4%] left-[8%] h-[9%] w-[9.6%] cursor-pointer rounded-md"
              onClick={() => setState("modules")}
            />
            <button
              type="button"
              aria-label="Files tab"
              aria-pressed={state === "files"}
              className="absolute top-[4%] left-[17.6%] h-[9%] w-[6.4%] cursor-pointer rounded-md"
              onClick={() => setState("files")}
            />
          </>
        )}
      </div>

      {state !== "sent" && (
        <button
          type="button"
          aria-label="Send trip-photo.jpg to the phone"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            start.current = null;
            setOffset(null);
            setState("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setState("sent");
            }
          }}
          style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
          className={`absolute bottom-4 left-4 z-10 flex touch-none flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-ink/80 ${
            offset ? "cursor-grabbing bg-white/10" : "cursor-grab transition-transform duration-300 hover:bg-white/5"
          }`}
        >
          <span className="grid size-10 place-items-center rounded-md bg-linear-to-br from-[#f0997b] to-[#7f77dd] text-white shadow-lg">
            <ImageIcon className="size-5" aria-hidden="true" />
          </span>
          trip-photo.jpg
        </button>
      )}

      <p
        className="pointer-events-none absolute right-4 bottom-4 font-mono text-[10px] tracking-widest text-ink/55 uppercase"
        aria-live="polite"
      >
        {HINT[state]}
      </p>
    </div>
  );
}
