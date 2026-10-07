import type { ReactNode } from "react";

// Minimal browser chrome so site and web-app previews read as pages.
export function BrowserFrame({ url, action, children }: { url: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0f1016]">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/5 px-3">
        <i className="size-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <i className="size-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <i className="size-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-white/[0.05] px-2.5 py-0.5 font-mono text-[11px] text-ink/50">
          {url}
        </span>
        {action}
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
