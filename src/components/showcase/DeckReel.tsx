"use client";

import { useRef } from "react";
import { FileText, Folder } from "lucide-react";
import { useGSAP } from "@/lib/gsap";
import { Captions, type Caption, Cursor, Screen } from "./Showcase";
import { INTRO, caption, click, fadeIn, moveTo, reelTimeline } from "./engine";

// A 1440 × 900 desktop with Deck's notch on top. The notch states are real captures of
// Deck's renderer (850 × 314, transparent), centred on the top edge.
const W = 1440;
const H = 900;
const NOTCH = { x: (W - 850) / 2, w: 850, h: 314 };
const FRAMES = {
  dragOver: "/work/deck/6-drag-over-open-panel.webp",
  drop: "/work/deck/7-drop.webp",
  sent: "/work/deck/8-toast.webp",
  hover: "/work/deck/2-hover.webp",
  modules: "/work/deck/3-expanded.webp",
  files: "/work/deck/4-files.webp",
};
const PHOTO = { x: 40, y: 360 }; // desktop icon, top-left of its tile
const FILES_TAB = [NOTCH.x + 0.208 * NOTCH.w, 0.085 * NOTCH.h] as const;

const CAPTIONS: Caption[] = [
  ["Drag", "Drop a photo onto the notch"],
  ["Sent", "It lands on your phone over Wi-Fi, even when the phone is locked"],
  ["Peek", "Hover the notch"],
  ["Notes and to-dos", "Click the notch open"],
  ["Files", "Switch tabs"],
  ["Every monitor", "One notch on each screen, sharing one panel"],
];

function PhotoTile() {
  return (
    <span className="grid size-16 place-items-center overflow-hidden rounded-lg bg-[linear-gradient(160deg,#f0997b,#c8577a_45%,#3b3f8f)] shadow-lg ring-2 ring-white/80">
      <span className="mt-5 h-6 w-16 rounded-[50%] bg-[#1c2140]/70" />
    </span>
  );
}

export function DeckReel() {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = (s: string) => el.querySelector(s);
      const frame = (id: keyof typeof FRAMES) => q(`[data-frame="${id}"]`);
      const caps = el.querySelectorAll("[data-caption]");
      const tl = reelTimeline(el);
      const c = cursor.current!;
      const ghost = q("[data-ghost]")!;
      const idle = q("[data-idle]")!;

      tl.fromTo(c, { autoAlpha: 0, x: 760, y: 560 }, { autoAlpha: 1, duration: 0.1 }, INTRO);
      caption(tl, caps[0], 0.9, 2.8);
      moveTo(tl, c, PHOTO.x + 50, PHOTO.y + 40, 0.9, 0.45);
      click(tl, c, 1.4);
      tl.to(q("[data-photo-icon]"), { backgroundColor: "rgb(255 255 255 / 0.14)", duration: 0.05 }, 1.4);
      tl.fromTo(ghost, { autoAlpha: 0, x: PHOTO.x + 18, y: PHOTO.y + 8 }, { autoAlpha: 0.9, duration: 0.05 }, 1.42);
      // The drag: cursor and ghost travel together, curving up to the notch.
      for (const [x, y, at, d] of [
        [430, 300, 1.45, 0.8],
        [720, 64, 2.25, 0.5],
      ] as const) {
        tl.to(c, { x, y, duration: d, ease: "power1.inOut" }, at);
        tl.to(ghost, { x: x - 32, y: y - 32, duration: d, ease: "power1.inOut" }, at);
      }
      fadeIn(tl, frame("dragOver"), 2.45, 0.12);
      tl.to(idle, { opacity: 0, duration: 0.1 }, 2.45);
      // Drop: the photo goes into the notch and Deck confirms.
      tl.to(ghost, { x: 688, y: 0, scale: 0.3, autoAlpha: 0, duration: 0.15 }, 2.8);
      fadeIn(tl, frame("drop"), 2.82, 0.08);
      tl.to(frame("dragOver"), { opacity: 0, duration: 0.08 }, 2.9);
      fadeIn(tl, frame("sent"), 2.95);
      caption(tl, caps[1], 2.9, 3.8);
      tl.to([frame("sent"), frame("drop")], { opacity: 0, duration: 0.12 }, 3.85);
      tl.to(idle, { opacity: 1, duration: 0.12 }, 3.85);

      caption(tl, caps[2], 4.1, 4.9);
      moveTo(tl, c, W / 2, 14, 3.9, 0.4);
      fadeIn(tl, frame("hover"), 4.3, 0.1);
      tl.to(idle, { opacity: 0, duration: 0.1 }, 4.3);
      caption(tl, caps[3], 5.0, 5.9);
      click(tl, c, 4.9);
      fadeIn(tl, frame("modules"), 5.0);
      caption(tl, caps[4], 6.2, 6.9);
      moveTo(tl, c, ...FILES_TAB, 5.85, 0.35);
      click(tl, c, 6.25);
      fadeIn(tl, frame("files"), 6.35);
      caption(tl, caps[5], 7.0, 7.9);
      tl.to({}, { duration: 0.3 }, 7.9);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="absolute inset-0 bg-[#0e1120]">
      <Screen
        width={W}
        height={H}
        follow={cursor}
        fill={0.96}
        className="overflow-hidden rounded-xl shadow-[0_0_0_10px_#16161d,0_30px_120px_rgb(0_0_0/0.6)]"
      >
        {/* Wallpaper and desktop, drawn. */}
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_25%_15%,#3c4f96,transparent_60%),radial-gradient(70%_60%_at_85%_85%,#6d3c8f,transparent_60%)]" />
        <ul className="absolute top-[100px] left-10 flex flex-col gap-8 text-[13px] text-white/90">
          <li className="flex w-[100px] flex-col items-center gap-1.5 rounded-md p-2">
            <Folder className="size-14 fill-[#f3c969] text-[#d9a73e]" strokeWidth={1.2} aria-hidden="true" />
            Projects
          </li>
          <li className="flex w-[100px] flex-col items-center gap-1.5 rounded-md p-2">
            <FileText className="size-14 text-white/85" strokeWidth={1.2} aria-hidden="true" />
            notes.txt
          </li>
        </ul>
        <div
          data-photo-icon
          className="absolute flex w-[100px] flex-col items-center gap-1.5 rounded-md p-2 text-[13px] text-white/90"
          style={{ left: PHOTO.x, top: PHOTO.y }}
        >
          <PhotoTile />
          trip-photo.jpg
        </div>
        <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-center gap-2 bg-[#14141c]/85 pointer-fine:backdrop-blur">
          {["#2ee6a6", "#f3c969", "#e5564b", "#3fbf8a", "#a76cf0"].map((bg) => (
            <span key={bg} className="size-8 rounded-md opacity-90" style={{ background: bg }} />
          ))}
          <span className="absolute right-5 text-xs text-white/75">5:32 PM</span>
        </div>

        {/* The notch: drawn when collapsed, captured in every other state. */}
        <div className="absolute top-0" style={{ left: NOTCH.x, width: NOTCH.w, height: NOTCH.h }}>
          <div data-idle className="absolute top-0 left-1/2 -ml-[68px] h-[11px] w-[136px] rounded-b-lg bg-black" />
          {(Object.keys(FRAMES) as (keyof typeof FRAMES)[]).map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- transparent UI captures, swapped by opacity
            <img
              key={id}
              data-frame={id}
              src={FRAMES[id]}
              alt=""
              width={NOTCH.w}
              height={NOTCH.h}
              draggable={false}
              className="absolute inset-0 opacity-0"
            />
          ))}
        </div>

        <div data-ghost className="pointer-events-none invisible absolute top-0 left-0">
          <PhotoTile />
        </div>
        <Cursor ref={cursor} />
      </Screen>
      <Captions items={CAPTIONS} />
    </div>
  );
}
