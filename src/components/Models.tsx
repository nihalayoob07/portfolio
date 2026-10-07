import { models } from "@/content/models";
import { Showcase } from "./showcase/Showcase";
import { PrintStage } from "./prints/PrintStage";

// Order and scroll length (in screens) of each print's panel.
const PANELS: [slug: string, screens: number][] = [
  ["medbox", 4],
  ["cat-clicker", 3],
  ["tissue-box", 3],
  ["z-ring", 4],
];

export function Models() {
  const list = PANELS.map(([slug, screens]) => ({ model: models.find((m) => m.slug === slug)!, screens }));
  return (
    <section id="models" className="relative z-10" aria-labelledby="models-title">
      <div className="px-5 pt-24 pb-14 md:px-10 lg:pl-30">
        <h2 id="models-title" className="text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-tight">
          3D <span className="text-accent">models</span>
        </h2>
        <p className="mt-5 max-w-md text-muted">
          Designed in CAD, sliced in Bambu Studio, then printed and tested by me. Rendered here from the actual print files.
        </p>
      </div>
      {list.map(({ model: m, screens }, i) => (
        <Showcase
          key={m.slug}
          id={`model-${m.slug}`}
          index={i}
          total={list.length}
          title={m.title}
          category={`3D print · ${m.parts} parts · ${m.size.map(Math.round).join(" × ")} mm`}
          summary={m.blurb}
          screens={screens}
        >
          <PrintStage model={m} />
        </Showcase>
      ))}
    </section>
  );
}
