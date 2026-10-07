"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { site } from "@/content/site";
import { gsap, useGSAP, MOTION } from "@/lib/gsap";

function RoleRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % site.roles.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  const prev = (index - 1 + site.roles.length) % site.roles.length;
  const state = (i: number) => (i === index ? "is-active" : i === prev ? "is-leaving" : "");

  return (
    <div aria-live="off">
      <p className="sr-only">{site.roles.map((r) => r.word).join(", ")}</p>
      <div className="roles text-lg text-accent-soft md:text-2xl" aria-hidden="true">
        {site.roles.map((r, i) => (
          <span key={r.word} className={state(i)}>
            {r.article}
          </span>
        ))}
      </div>
      <div className="roles display text-[clamp(2.4rem,7.4vw,7.2rem)] whitespace-nowrap text-accent" aria-hidden="true">
        {site.roles.map((r, i) => (
          <span key={r.word} className={state(i)}>
            {r.word}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        // Photo turns slightly toward the pointer; the glow drifts after it.
        const fine = window.matchMedia("(pointer: fine)").matches;
        if (fine && photo.current && glow.current) {
          const rotY = gsap.quickTo(photo.current, "rotationY", { duration: 0.8, ease: "power3" });
          const rotX = gsap.quickTo(photo.current, "rotationX", { duration: 0.8, ease: "power3" });
          const shiftX = gsap.quickTo(photo.current, "x", { duration: 0.8, ease: "power3" });
          const glowX = gsap.quickTo(glow.current, "x", { duration: 1.6, ease: "power3" });
          const glowY = gsap.quickTo(glow.current, "y", { duration: 1.6, ease: "power3" });
          const onMove = (e: PointerEvent) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            rotY(nx * 7);
            rotX(-ny * 4);
            shiftX(nx * 14);
            glowX(nx * window.innerWidth * 0.18);
            glowY(ny * window.innerHeight * 0.14);
          };
          window.addEventListener("pointermove", onMove);
          return () => window.removeEventListener("pointermove", onMove);
        }
      });
      mm.add(MOTION, () => {
        // Scrolling away: the photo sinks and the type lifts.
        gsap.to("[data-hero-photo]", {
          yPercent: 12,
          opacity: 0.35,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-hero-type]", {
          yPercent: -30,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="top" ref={root} className="relative h-[100svh] min-h-[620px] overflow-hidden">
      {/* CSS intro on the wrappers, GSAP pointer motion on the inner elements, so the two transforms never fight. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[58%] left-1/2 h-[min(80vw,52rem)] w-[min(80vw,52rem)]"
        style={{ animation: "glow-in 1.6s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div
          ref={glow}
          className="h-full w-full rounded-full"
          style={{
            background: "radial-gradient(circle, rgb(79 125 255 / 0.42), rgb(79 125 255 / 0.08) 45%, rgb(79 125 255 / 0) 70%)",
            animation: "breathe 6s ease-in-out 1.6s infinite",
          }}
        />
      </div>

      <div data-hero-photo className="absolute inset-x-0 bottom-0 flex h-[62%] justify-center [perspective:1200px] sm:h-[78%] md:h-[88%]">
        <div className="intro-fade h-full" style={{ animationDelay: "0.35s" }}>
          <div
            ref={photo}
            className="relative h-full w-auto [mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
            style={{ aspectRatio: `${site.heroImage.width} / ${site.heroImage.height}` }}
          >
            <Image
              src={site.heroImage.src}
              width={site.heroImage.width}
              height={site.heroImage.height}
              alt={`Portrait of ${site.name}`}
              priority
              sizes="(max-width: 768px) 80vw, 40vw"
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>

      <div data-hero-type className="relative z-10 flex h-full flex-col justify-between px-5 pt-24 pb-10 md:px-10 md:pt-28 md:pb-12">
        <div>
          <p className="intro-line text-lg text-accent-soft md:text-2xl">
            <span style={{ animationDelay: "0.1s" }}>Hello! I&apos;m</span>
          </p>
          <h1 className="display mt-1 text-[clamp(2.8rem,8vw,8rem)]">
            <span className="intro-line">
              <span style={{ animationDelay: "0.2s" }}>Nihal</span>
            </span>
            <span className="intro-line">
              <span style={{ animationDelay: "0.3s" }}>Ayoob</span>
            </span>
          </h1>
        </div>

        <div className="flex items-end justify-between gap-6 lg:pl-16">
          <div className="intro-fade" style={{ animationDelay: "0.6s" }}>
            <RoleRotator />
          </div>
          <p
            className="intro-fade hidden text-right font-mono text-xs leading-relaxed tracking-widest text-muted uppercase sm:block"
            style={{ animationDelay: "0.8s" }}
          >
            {site.studying}
            <br />
            {site.location}
          </p>
        </div>
      </div>
    </section>
  );
}
