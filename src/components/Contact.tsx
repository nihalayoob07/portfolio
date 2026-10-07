import { ArrowUpRight, Mail } from "lucide-react";
import { site } from "@/content/site";

export function Contact() {
  return (
    <footer id="contact" className="relative z-10 overflow-hidden border-t border-line px-5 pt-28 pb-10 md:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgb(79 125 255 / 0.22), transparent)" }}
      />
      <div className="relative mx-auto max-w-7xl">
        <p className="eyebrow">Get in touch</p>
        <p className="mt-6 max-w-3xl text-[clamp(1.8rem,4vw,3.4rem)] leading-[1.1] font-semibold tracking-tight">
          Building something, or need an engineer who ships? Let&apos;s talk.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent/85"
          >
            <Mail className="size-4" aria-hidden="true" /> Email me
          </a>
          <a
            href="https://github.com/nihalayoob07"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-medium transition hover:border-accent hover:text-accent-soft"
          >
            GitHub <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <p className="display mt-24 text-[clamp(3rem,11vw,10rem)] leading-[0.85]">{site.name}</p>

        <div className="mt-12 grid gap-10 border-t border-line pt-10 text-sm md:grid-cols-3">
          <div className="space-y-4">
            <div>
              <p className="text-muted">Email</p>
              <a href={`mailto:${site.email}`} className="hover:text-accent-soft">
                {site.email}
              </a>
            </div>
            <div>
              <p className="text-muted">Location</p>
              <p>{site.location}</p>
            </div>
          </div>
          <div>
            <p className="text-muted">Social</p>
            <ul className="mt-1 space-y-1.5">
              {site.socials
                .filter((s) => s.icon !== "mail")
                .map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-lg hover:text-accent-soft"
                    >
                      {s.label} <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
            </ul>
          </div>
          <div className="md:text-right">
            <p className="text-lg">
              Designed and built by <span className="text-accent-soft">{site.name}</span>
            </p>
            <p className="mt-1 text-muted">© {site.year}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
