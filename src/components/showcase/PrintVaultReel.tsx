"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import reel from "@/content/reels/printvault.json";
import { Ambient, Captions, type Caption, Cursor, Screen } from "./Showcase";
import { INTRO, caption, click, fadeIn, moveTo, reelTimeline, typeText } from "./engine";

const [W, H] = reel.viewport;
const F = reel.frames;
const T = reel.targets;
const ORDER = ["home", "product", "added", "cart", "checkout"] as const;

// Typed over the empty checkout capture; nothing was entered on the live store.
const FIELDS: [keyof typeof T, string][] = [
  ["customer_name", "Demo Customer"],
  ["email", "demo@example.com"],
  ["phone", "98765 43210"],
  ["line1", "12, Lighthouse Hill Road"],
  ["line2", "Near Hampankatta"],
  ["city", "Mangaluru"],
  ["pincode", "575001"],
  ["state", "Karnataka"],
];
// Scroll the home page until the phone stand card sits just below mid-screen.
const HOME_PAN = Math.round(T.product.y + T.product.h / 2 - 520);
const CHECKOUT_PAN = F.checkout.height - H;

const CAPTIONS: Caption[] = [
  ["Browse", "The live catalogue at theprintvault.in"],
  ["Add to cart", "Open a product, add it in one click"],
  ["Cart on the device", "Kept in the customer's own browser"],
  ["Guest checkout", "Live shipping quote and a full GST breakdown"],
  ["Pay with Razorpay", "UPI, cards or netbanking, verified on the server"],
];

const typing = (text: string) => Math.max(0.2, text.length * 0.03);
const TYPED = 5.5 + 0.45 + FIELDS.reduce((n, [, text]) => n + 0.35 + typing(text), 0);

const centre = (k: keyof typeof T, pan = 0) => [T[k].x + T[k].w / 2, T[k].y + T[k].h / 2 - pan] as const;

export function PrintVaultReel() {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = (s: string) => el.querySelector(s)!;
      const caps = el.querySelectorAll("[data-caption]");
      const tl = reelTimeline(el);
      const c = cursor.current!;

      tl.fromTo(c, { autoAlpha: 0, x: 980, y: 300 }, { autoAlpha: 1, duration: 0.1 }, INTRO);
      tl.to(q('[data-frame="home"]'), { y: -HOME_PAN, duration: 1.2, ease: "power1.inOut" }, 0.9);
      caption(tl, caps[0], 0.9, 2.3);
      moveTo(tl, c, ...centre("product", HOME_PAN), 1.9, 0.5);
      click(tl, c, 2.45);
      fadeIn(tl, q('[data-frame="product"]'), 2.55);

      caption(tl, caps[1], 2.6, 3.7);
      moveTo(tl, c, ...centre("add"), 2.8, 0.5);
      click(tl, c, 3.4);
      fadeIn(tl, q('[data-frame="added"]'), 3.5, 0.1);

      caption(tl, caps[2], 3.8, 5.0);
      moveTo(tl, c, ...centre("cartIcon"), 3.8, 0.5);
      click(tl, c, 4.35);
      fadeIn(tl, q('[data-frame="cart"]'), 4.45);
      moveTo(tl, c, ...centre("checkout"), 4.6, 0.5);
      click(tl, c, 5.15);
      fadeIn(tl, q('[data-frame="checkout"]'), 5.25);

      // Fill the form field by field, scrolling the page once the lower fields are reached.
      let t = 5.5;
      let pan = 0;
      caption(tl, caps[3], 5.3, TYPED);
      for (const [name, text] of FIELDS) {
        if (name === "city") {
          tl.to(q('[data-frame="checkout"]'), { y: -CHECKOUT_PAN, duration: 0.4, ease: "power1.inOut" }, t);
          pan = CHECKOUT_PAN;
          t += 0.45;
        }
        moveTo(tl, c, T[name].x + Math.min(160, T[name].w / 2), T[name].y + T[name].h / 2 - pan, t, 0.25);
        click(tl, c, t + 0.27);
        const box = q(`[data-field="${name}"]`) as HTMLElement;
        typeText(tl, box.querySelector("[data-text]")!, text, t + 0.3, typing(text), (on) => {
          box.style.opacity = on ? "1" : "0";
        });
        t += 0.35 + typing(text);
      }
      caption(tl, caps[4], t + 0.1, t + 1.6);
      moveTo(tl, c, ...centre("pay", pan), t, 0.4);
      tl.to(q("[data-pay]"), { opacity: 1, duration: 0.15 }, t + 0.35);
      tl.to({}, { duration: 0.5 }, t + 1.6);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="absolute inset-0">
      <Ambient src={F.product.src} />
      <Screen width={W} height={H} follow={cursor} className="overflow-hidden rounded-xl shadow-[0_30px_120px_rgb(0_0_0/0.6)]">
        {ORDER.map((id, i) => (
          <div
            key={id}
            data-frame={id}
            className="absolute top-0 left-0"
            style={{ width: W, height: F[id].height, opacity: i === 0 ? 1 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized captures, positioned in recording pixels */}
            <img src={F[id].src} alt="" width={W} height={F[id].height} className="block" draggable={false} />
            {id === "checkout" && (
              <>
                {FIELDS.map(([name]) => (
                  <div
                    key={name}
                    data-field={name}
                    className="absolute flex items-center rounded-full bg-[#171717] pl-4 font-sans text-base text-[#f5f5f5] opacity-0"
                    style={{
                      left: T[name].x + 1,
                      top: T[name].y + 1,
                      width: T[name].w - (name === "state" ? 44 : 2),
                      height: T[name].h - 2,
                    }}
                  >
                    <span data-text />
                    <span className="ml-px h-5 w-px animate-pulse bg-white/80" />
                  </div>
                ))}
                <div
                  data-pay
                  className="absolute rounded-full opacity-0 shadow-[0_0_0_3px_rgb(255_255_255/0.5),0_0_40px_rgb(255_255_255/0.35)]"
                  style={{ left: T.pay.x, top: T.pay.y, width: T.pay.w, height: T.pay.h }}
                />
              </>
            )}
          </div>
        ))}
        <Cursor ref={cursor} />
      </Screen>
      <Captions items={CAPTIONS} />
    </div>
  );
}
