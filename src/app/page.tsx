import { preload } from "react-dom";
import { About } from "@/components/About";
import { Chrome } from "@/components/Chrome";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Journey } from "@/components/Journey";
import { Models } from "@/components/Models";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SoundPrompt } from "@/components/SoundPrompt";
import { TechStack } from "@/components/TechStack";
import { WhatIDo } from "@/components/WhatIDo";
import { Work } from "@/components/Work";
import { site } from "@/content/site";

export default function Home() {
  preload(site.heroImage.src, { as: "image", imageSrcSet: site.heroImage.srcSet, imageSizes: site.heroSizes, fetchPriority: "high" });

  return (
    <>
      <a
        href="#content"
        className="fixed top-3 left-3 z-[80] -translate-y-20 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <Chrome />
      <main id="content">
        <Hero />
        <About />
        <WhatIDo />
        <Journey />
        <Work />
        <Models />
        <TechStack />
      </main>
      <Contact />
      <SoundPrompt />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
