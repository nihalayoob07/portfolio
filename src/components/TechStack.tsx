import { skills } from "@/content/skills";
import { BrandIcon } from "./icons";

// Brand colours too dark to read on the page fall back to the ink colour.
function hoverColor(hex: string) {
  const n = parseInt(hex, 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum < 70 ? "var(--color-ink)" : `#${hex}`;
}

export function TechStack() {
  return (
    <section className="relative z-10 px-5 py-24 md:px-10 md:py-32" aria-labelledby="stack-title">
      <h2 id="stack-title" className="text-center text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-tight">
        Tech <span className="text-accent">stack</span>
      </h2>
      <ul className="mx-auto mt-14 grid max-w-6xl grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {skills.map((s) => (
          <li
            key={s.label}
            className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white/[0.015] p-3 text-center transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-accent/[0.05]"
            style={{ "--brand": hoverColor(s.icon.hex) } as React.CSSProperties}
          >
            <BrandIcon icon={s.icon} className="size-7 text-ink/75 transition-colors duration-300 group-hover:text-(--brand)" />
            <span className="text-[11px] leading-tight text-muted group-hover:text-ink">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
