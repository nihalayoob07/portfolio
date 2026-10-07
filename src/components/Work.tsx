import type { ComponentType } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { projects, type ReelId } from "@/content/projects";
import { Showcase } from "./showcase/Showcase";
import { DeckReel } from "./showcase/DeckReel";
import { DrillReel } from "./showcase/DrillReel";
import { PrintLedgerReel } from "./showcase/PrintLedgerReel";
import { PrintVaultReel } from "./showcase/PrintVaultReel";

// Each reel and how many screens of scrolling it plays over.
const REELS: Record<ReelId, { Reel: ComponentType; screens: number }> = {
  printvault: { Reel: PrintVaultReel, screens: 5 },
  drill: { Reel: DrillReel, screens: 5 },
  deck: { Reel: DeckReel, screens: 6 },
  printledger: { Reel: PrintLedgerReel, screens: 5 },
};

const featured = projects.filter((p) => p.reel);
const more = projects.filter((p) => !p.reel);

export function Work() {
  return (
    <section id="work" className="relative z-10" aria-labelledby="work-title">
      <h2
        id="work-title"
        className="px-5 pt-24 pb-14 text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-medium tracking-tight md:px-10 lg:pl-30"
      >
        My <span className="text-accent">work</span>
      </h2>

      {featured.map((p, i) => {
        const { Reel, screens } = REELS[p.reel!];
        return (
          <Showcase
            key={p.slug}
            id={`work-${p.slug}`}
            index={i}
            total={featured.length}
            title={p.title}
            category={p.category}
            status={p.status}
            summary={p.summary}
            links={p.links}
            screens={screens}
          >
            <Reel />
          </Showcase>
        );
      })}

      <div className="px-5 py-24 md:px-10 lg:pr-20 lg:pl-30">
        <h3 className="eyebrow">More projects</h3>
        <ul className="mt-8 border-b border-line">
          {more.map((p) => (
            <li key={p.slug} className="grid gap-x-10 gap-y-3 border-t border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div>
                <p className="text-2xl font-semibold tracking-tight md:text-3xl">{p.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {p.category}
                  {p.status && <span className="text-ink/60"> · {p.status}</span>}
                </p>
              </div>
              <div>
                <p className="leading-relaxed text-ink/85">{p.summary}</p>
                <p className="mt-3 font-mono text-xs tracking-wide text-muted">{p.stack.join(" · ")}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  {p.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-accent-soft hover:text-ink"
                    >
                      {l.label} <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  ))}
                  {p.privateRepo && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Lock className="size-3.5" aria-hidden="true" /> Private repo
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <a
          href="https://github.com/nihalayoob07"
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-accent hover:text-accent-soft"
        >
          More on github.com/nihalayoob07 <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
