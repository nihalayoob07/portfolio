"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import reel from "@/content/reels/printledger.json";
import { Ambient, Captions, type Caption, Cursor, Frame, Screen } from "./Showcase";
import { INTRO, caption, click, fadeIn, moveTo, reelTimeline } from "./engine";

const [W, H] = reel.viewport;
const F = reel.frames;
const T = reel.targets;
const ORDER = ["empty", "weight", "time", "details", "logged", "ledgerView", "bills"] as const;

const CAPTIONS: Caption[] = [
  ["Grams + hours", "Material and run time in, a price out"],
  ["Your own costs", "Filament, power, labour and margin, set per shop"],
  ["Log the sale", "Revenue and profit update straight away"],
  ["The ledger", "Search, filter and sort every print"],
  ["Bills", "Group finished prints into one bill"],
];

const centre = (k: keyof typeof T) => [T[k].x + T[k].w / 2, T[k].y + T[k].h / 2] as const;

export function PrintLedgerReel() {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const frame = (id: string) => el.querySelector(`[data-frame="${id}"]`);
      const caps = el.querySelectorAll("[data-caption]");
      const tl = reelTimeline(el);
      const c = cursor.current!;

      tl.fromTo(c, { autoAlpha: 0, x: 900, y: 220 }, { autoAlpha: 1, duration: 0.1 }, INTRO);
      caption(tl, caps[0], 0.9, 2.4);
      moveTo(tl, c, T.weight.x + 90, T.weight.y + T.weight.h / 2, 0.9);
      click(tl, c, 1.32);
      fadeIn(tl, frame("weight"), 1.45);
      moveTo(tl, c, T.time.x + 90, T.time.y + T.time.h / 2, 1.7, 0.35);
      click(tl, c, 2.08);
      fadeIn(tl, frame("time"), 2.2);

      caption(tl, caps[1], 2.5, 3.5);
      moveTo(tl, c, T.product.x + 90, T.product.y + T.product.h / 2, 2.4, 0.3);
      click(tl, c, 2.72);
      moveTo(tl, c, T.customer.x + 90, T.customer.y + T.customer.h / 2, 2.8, 0.3);
      click(tl, c, 3.12);
      fadeIn(tl, frame("details"), 3.2);

      caption(tl, caps[2], 3.65, 4.6);
      moveTo(tl, c, ...centre("log"), 3.3, 0.35);
      click(tl, c, 3.7);
      fadeIn(tl, frame("logged"), 3.78, 0.1);

      caption(tl, caps[3], 4.7, 5.6);
      moveTo(tl, c, ...centre("ledger"), 4.1, 0.4);
      click(tl, c, 4.55);
      fadeIn(tl, frame("ledgerView"), 4.65);

      caption(tl, caps[4], 5.7, 6.8);
      moveTo(tl, c, 1180, 820, 5.5, 0.3);
      fadeIn(tl, frame("bills"), 5.75, 0.2);
      tl.to({}, { duration: 0.3 }, 6.8);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="absolute inset-0">
      <Ambient src={F.empty.src} />
      <Screen width={W} height={H} follow={cursor} full className="overflow-hidden rounded-xl shadow-[0_30px_120px_rgb(0_0_0/0.6)]">
        {ORDER.map((id, i) => (
          <Frame
            key={id}
            data-frame={id}
            src={F[id].src}
            width={W}
            height={H}
            className="absolute top-0 left-0"
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))}
        <Cursor ref={cursor} />
      </Screen>
      <Captions items={CAPTIONS} place="corner" />
    </div>
  );
}
