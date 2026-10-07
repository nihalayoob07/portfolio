import type { Project } from "@/content/projects";

// CSS-drawn covers for projects that have no screenshot to show.
export function ProjectPoster({ kind }: { kind: NonNullable<Project["poster"]> }) {
  if (kind === "server") {
    const lines: [string, string?][] = [
      ["$ docker compose up -d --build"],
      ["  ✔ printvault", "healthy"],
      ["$ cloudflared tunnel run"],
      ["  tunnel connected, no open ports", "ok"],
      ["$ ./backup.sh"],
      ["  VACUUM INTO snapshot", "rotated"],
      ["$ sudo reboot"],
      ["  printvault restarted on boot", "ok"],
    ];
    return (
      <div className="flex h-full w-full flex-col bg-[#0d0f14] font-mono text-[11px] leading-relaxed sm:text-xs">
        <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
          <i className="size-2.5 rounded-full bg-white/15" />
          <i className="size-2.5 rounded-full bg-white/15" />
          <i className="size-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-white/35">fedora-server</span>
        </div>
        <div className="flex-1 space-y-0.5 px-4 py-3">
          {lines.map(([text, tag], i) => (
            <p key={i} className={text.startsWith("$") ? "text-ink/90" : "text-ink/45"}>
              {text} {tag && <span className="text-accent-soft">[{tag}]</span>}
            </p>
          ))}
          <p className="text-ink/90">
            $ <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-accent" />
          </p>
        </div>
      </div>
    );
  }

  if (kind === "flow") {
    const steps = ["WhatsApp order", "Livekeeping invoice", "e-way bill + e-invoice", "PDF back to group"];
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

  if (kind === "nova") {
    return (
      <div className="flex h-full w-full flex-col items-start justify-center gap-5 bg-[#10111a] px-6 sm:px-10">
        <span className="display text-6xl tracking-[0.2em] text-ink sm:text-7xl">Nova</span>
        <div>
          <div className="flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className={`size-3 rounded-full sm:size-3.5 ${i < 8 ? "bg-accent" : "bg-white/10"}`} />
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] tracking-widest text-ink/50 uppercase">Activities · Learn · Connect</p>
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
