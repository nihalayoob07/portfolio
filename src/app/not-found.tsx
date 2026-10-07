import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-5 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[44rem] -translate-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgb(79 125 255 / 0.22), transparent)" }}
      />
      <div className="relative">
        <p className="eyebrow">Error 404</p>
        <h1 className="display mt-5 text-[clamp(4rem,16vw,12rem)]">
          Off the <span className="text-accent">bed</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-ink/75">
          This page didn&apos;t print. The link may be old, or the address has a typo.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent/85"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to the portfolio
        </Link>
      </div>
      <div className="grain" aria-hidden="true" />
    </main>
  );
}
