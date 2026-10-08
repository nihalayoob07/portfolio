"use client";

import { useEffect, useState } from "react";
import { Menu, X, FileText } from "lucide-react";
import { site } from "@/content/site";
import { SocialIcon } from "./icons";
import { SoundToggle } from "./SoundToggle";

function RollText({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

// Fixed header, side socials and resume link that sit over every section.
// Which menu item the current scroll position belongs to (the hero and about text count as About).
function useCurrentSection() {
  const [current, setCurrent] = useState("#top");
  useEffect(() => {
    const ids = ["work", "models", "contact"];
    const pick = () => {
      const line = window.innerHeight * 0.4;
      let found = "#top";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) found = `#${id}`;
      }
      setCurrent(found);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    return () => window.removeEventListener("scroll", pick);
  }, []);
  return current;
}

export function Chrome() {
  const [open, setOpen] = useState(false);
  const current = useCurrentSection();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="edge-glow -top-40 -left-40 h-[22rem] w-[22rem] opacity-70" aria-hidden="true" />
      <div className="edge-glow top-1/3 -right-56 h-[30rem] w-[30rem] opacity-50" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-50 bg-linear-to-b from-bg/90 via-bg/50 to-transparent">
        <div className="flex h-16 items-center justify-between px-5 md:px-10">
          <a href="#top" className="text-sm font-bold tracking-tight" aria-label={`${site.name}, back to top`}>
            {site.initials}
          </a>
          <a
            href={`mailto:${site.email}`}
            className="absolute left-1/2 hidden -translate-x-1/2 text-[13px] font-medium tracking-wide text-ink/85 hover:text-ink md:block"
          >
            <RollText>{site.email}</RollText>
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[13px] font-semibold tracking-wider uppercase md:flex">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={current === item.href ? "location" : undefined}
                className="relative hover:text-accent-soft aria-[current]:text-accent-soft"
              >
                <RollText>{item.label}</RollText>
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-[width] duration-300 ${current === item.href ? "w-full" : "w-0"}`}
                  aria-hidden="true"
                />
              </a>
            ))}
            <SoundToggle variant="nav" className="uppercase" />
          </nav>
          <div className="-mr-2 flex items-center gap-1 md:hidden">
            <SoundToggle variant="nav" className="p-2" />
            <button
              type="button"
              className="p-2"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-40 flex flex-col justify-center bg-bg/[0.97] px-5 md:hidden">
          <nav aria-label="Sections" className="flex flex-col gap-2">
            {site.nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="display text-5xl">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-12 flex gap-6 text-muted">
            {site.socials.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label} className="hover:text-ink">
                <SocialIcon name={s.icon} className="size-6" />
              </a>
            ))}
          </div>
        </div>
      )}

      <ul className="fixed bottom-8 left-8 z-30 hidden flex-col gap-6 lg:flex">
        {site.socials.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              aria-label={s.label}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="block text-ink/80 transition hover:-translate-y-0.5 hover:text-accent-soft"
            >
              <SocialIcon name={s.icon} className="size-[22px]" />
            </a>
          </li>
        ))}
      </ul>

      {site.resumeUrl && (
        <a
          href={site.resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="fixed right-8 bottom-8 z-30 hidden items-center gap-2 text-sm font-medium tracking-[0.25em] text-ink/70 uppercase hover:text-ink lg:flex"
        >
          Resume <FileText className="size-4" aria-hidden="true" />
        </a>
      )}
    </>
  );
}
