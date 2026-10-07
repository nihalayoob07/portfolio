"use client";

import { useRef } from "react";
import localFont from "next/font/local";
import { useGSAP } from "@/lib/gsap";
import { Captions, type Caption, Screen } from "./Showcase";
import { INTRO, caption, reelTimeline } from "./engine";

// The alarm's own counter font, so the live count matches the capture underneath it.
const anton = localFont({ src: "../../fonts/Anton-Regular.ttf", preload: false });

// Captures from the Android app, 540 × 1080.
const W = 540;
const H = 1080;
const SCREENS = ["2-briefing", "3-workout", "4-moves", "5-exercise", "6-plan", "7-progress"];
const STEPS = 30;
const RING = [INTRO, 4.0]; // timeline span where the alarm rings
const COUNT = [1.5, 3.9]; // and where the steps are counted

const CAPTIONS: Caption[] = [
  ["5:32 AM", "The alarm goes off"],
  ["Walk 30 steps", "It only stops once the step sensor has counted them"],
  ["Morning briefing"],
  ["Today's workout"],
  ["Exercise library"],
  ["Form demos", "For every move"],
  ["12-week programme"],
  ["Progress"],
];

export function DrillReel() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const caps = el.querySelectorAll("[data-caption]");
      const phone = el.querySelector<HTMLElement>("[data-phone]")!;
      const count = el.querySelector("[data-count]")!;
      const tl = reelTimeline(el);

      // Ringing is a looping CSS shake, switched on while the playhead is inside the ring span.
      tl.eventCallback("onUpdate", () => {
        const t = tl.time();
        phone.dataset.ringing = String(t > RING[0] && t < RING[1]);
      });

      caption(tl, caps[0], 0.9, 1.6);
      caption(tl, caps[1], 1.7, 3.95);
      const o = { n: 0 };
      tl.to(
        o,
        {
          n: STEPS,
          duration: COUNT[1] - COUNT[0],
          onUpdate: () => {
            count.textContent = `${Math.floor(o.n)} / ${STEPS}`;
          },
        },
        COUNT[0],
      );

      // Dismissed: the app moves on screen by screen, each sliding in like the app's own navigation.
      el.querySelectorAll("[data-screen]").forEach((s, i) => {
        const at = 4.05 + i * 0.8;
        tl.fromTo(s, { x: W }, { x: 0, duration: 0.3, ease: "power2.out" }, at);
        caption(tl, caps[i + 2], at + 0.2, at + 0.8);
      });
      tl.to({}, { duration: 0.3 }, 4.05 + SCREENS.length * 0.8);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,#2a120a,#0a0a0c_70%)]">
      <Screen width={W + 36} height={H + 36} fill={0.86}>
        <div data-phone className="drill-phone relative h-full w-full">
          {/* Sound rings while it rings. */}
          <span className="drill-ring absolute inset-0 rounded-[64px] border-2 border-[#ff5a2d]" aria-hidden="true" />
          <span
            className="drill-ring absolute inset-0 rounded-[64px] border-2 border-[#ff5a2d] [animation-delay:0.6s]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 overflow-hidden rounded-[64px] border-[18px] border-[#111114] bg-black shadow-[0_0_0_2px_#2c2c33,0_40px_120px_rgb(0_0_0/0.7)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- phone captures, positioned in their own pixels */}
            <img src="/work/drill/1-alarm.webp" alt="" width={W} height={H} className="absolute inset-0" draggable={false} />
            <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              <rect x="20" y="608" width="300" height="98" fill="#0a0a0a" />
              <text data-count x="28.3" y="695.7" fontSize="88" fill="#f3f0e8" className={anton.className}>
                0 / {STEPS}
              </text>
            </svg>
            {SCREENS.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element -- phone captures, positioned in their own pixels
              <img
                key={s}
                data-screen
                src={`/work/drill/${s}.webp`}
                alt=""
                width={W}
                height={H}
                draggable={false}
                className="absolute inset-0"
                style={{ transform: `translateX(${W}px)` }}
              />
            ))}
          </div>
        </div>
      </Screen>
      <Captions items={CAPTIONS} />
    </div>
  );
}
