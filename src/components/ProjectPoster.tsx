import type { Preview } from "@/content/projects";

// CSS-drawn covers for projects that have no screenshot to show.
export function ProjectPoster({ kind }: { kind: Extract<Preview, { kind: "poster" }>["poster"] }) {
  if (kind === "server") {
    // Request path from the internet to the database, as deployed.
    const hops = [
      { name: "Cloudflare edge", note: "TLS, caching" },
      { name: "Tunnel", note: "outbound only" },
      { name: "Caddy", note: "HTTPS, HSTS, headers" },
      { name: "Next.js", note: "Docker, non-root" },
      { name: "SQLite", note: "rotating snapshots" },
    ];
    return (
      <div className="flex h-full w-full flex-col justify-center gap-3 bg-[#0d0f14] px-4 sm:gap-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
          {hops.map((h, i) => (
            <div key={h.name} className="flex items-center gap-1.5">
              <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 sm:py-2">
                <p className="text-xs font-medium text-ink/90 sm:text-sm">{h.name}</p>
                <p className="hidden font-mono text-[10px] tracking-wider text-ink/45 uppercase sm:block">{h.note}</p>
              </div>
              {i < hops.length - 1 && (
                <span className="text-accent" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-widest text-ink/50 uppercase sm:text-[11px]">
          <span className="rounded border border-accent/40 px-2 py-1 text-accent-soft">Fedora Server</span>
          <span className="rounded border border-white/10 px-2 py-1">SELinux enforcing</span>
          <span className="rounded border border-white/10 px-2 py-1">0 open ports</span>
        </div>
      </div>
    );
  }

  if (kind === "flow") {
    const steps = ["WhatsApp order", "GST invoice", "e-way bill + e-invoice", "PDF back to the group"];
    return (
      <div className="flex h-full w-full flex-col justify-center gap-5 bg-[#0e1016] px-6 sm:px-10">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink/85 sm:text-sm">{s}</span>
              {i < steps.length - 1 && <span className="text-accent">→</span>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-widest text-ink/50 uppercase sm:text-[11px]">
          <span className="rounded border border-accent/40 px-2 py-1 text-accent-soft">dry run on</span>
          <span className="rounded border border-white/10 px-2 py-1">total verified</span>
          <span className="rounded border border-white/10 px-2 py-1">no duplicates</span>
        </div>
      </div>
    );
  }

  // Per-key RGB across a tenkeyless layout.
  const cols = 17;
  const rows = 6;
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0c0c10] p-5 sm:p-8">
      <div className="grid w-full gap-[3px] sm:gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const hue = 210 + ((col * 9 + row * 14) % 120);
          return (
            <i
              key={i}
              className="aspect-square rounded-[3px]"
              style={{ background: `hsl(${hue} 85% 60% / ${0.25 + ((col + row) % 5) * 0.12})` }}
            />
          );
        })}
      </div>
    </div>
  );
}
