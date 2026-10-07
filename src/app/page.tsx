import { About } from "@/components/About";
import { Chrome } from "@/components/Chrome";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Journey } from "@/components/Journey";
import { Models } from "@/components/Models";
import { SmoothScroll } from "@/components/SmoothScroll";
import { TechStack } from "@/components/TechStack";
import { WhatIDo } from "@/components/WhatIDo";
import { Work } from "@/components/Work";

export default function Home() {
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
    </>
  );
}
