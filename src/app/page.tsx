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
      <SmoothScroll />
      <Chrome />
      <main>
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
    </>
  );
}
