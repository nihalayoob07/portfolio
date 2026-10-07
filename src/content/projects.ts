export type ProjectLink = { label: string; href: string };

export type PhoneScreen = { src: string; label: string };

// What fills each card's preview area.
export type Preview =
  // A full-page capture of a live site: pans on hover, scrolls freely in the expanded view.
  | { kind: "page"; src: string; width: number; height: number; url: string }
  // A web app that runs for real in the expanded view; the card shows a capture of it.
  | { kind: "app"; src: string; poster: { src: string; width: number; height: number }; url: string }
  // Screens in a phone frame you can tap through.
  | { kind: "phone"; screens: PhoneScreen[] }
  // Deck's notch, driven by its real UI states.
  | { kind: "deck" }
  // A CSS-drawn cover for work with nothing to screenshot.
  | { kind: "poster"; poster: "server" | "flow" | "keyboard" };

export type Project = {
  slug: string;
  title: string;
  category: string;
  status?: string;
  stack: string[];
  summary: string;
  highlights: string[];
  links: ProjectLink[];
  privateRepo?: boolean;
  preview: Preview;
};

export const projects: Project[] = [
  {
    slug: "printvault",
    title: "ThePrint.Vault",
    category: "Full-stack e-commerce",
    status: "Live",
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind", "SQLite", "Razorpay"],
    summary: "A production store for a 3D-printing business: catalogue, cart, checkout, order tracking and custom print requests.",
    highlights: [
      "Razorpay payments verified server-side, with webhooks, OTP checks, coupons and GST",
      "Real-time admin order feed over Server-Sent Events, plus Gmail and WhatsApp alerts that fail independently of checkout",
    ],
    links: [{ label: "theprintvault.in", href: "https://theprintvault.in" }],
    privateRepo: true,
    preview: { kind: "page", src: "/work/printvault-page.webp", width: 1200, height: 7214, url: "theprintvault.in" },
  },
  {
    slug: "deck",
    title: "Deck",
    category: "Windows desktop app",
    status: "Shipped",
    stack: ["Electron", "Node.js", "JavaScript", "KDE Connect", "NSIS"],
    summary: "A notch at the top of every screen with notes, to-dos and drag-and-drop file transfer to your phone.",
    highlights: [
      "Notches follow monitors as they're plugged in or removed, with one shared panel across screens",
      "Drop files, folders, links or text on the notch and they land on your phone over Wi-Fi, even when it's locked",
    ],
    links: [],
    privateRepo: true,
    preview: { kind: "deck" },
  },
  {
    slug: "drill",
    title: "Drill",
    category: "Android app",
    status: "Coming to Google Play",
    stack: ["Kotlin", "Android", "JavaScript", "WebView"],
    summary: "An alarm you can only dismiss by walking, followed by a 12-week gym and calisthenics programme.",
    highlights: [
      "Steps are verified with the phone's hardware step counter before the alarm stops",
      "Native Kotlin shell with a web UI over a JavaScript bridge; fully offline, no accounts or analytics",
    ],
    links: [],
    privateRepo: true,
    preview: {
      kind: "phone",
      screens: [
        { src: "/work/drill/1-alarm.webp", label: "Alarm" },
        { src: "/work/drill/2-briefing.webp", label: "Morning briefing" },
        { src: "/work/drill/3-workout.webp", label: "Workout" },
        { src: "/work/drill/4-moves.webp", label: "Exercise library" },
        { src: "/work/drill/5-exercise.webp", label: "Exercise demo" },
        { src: "/work/drill/6-plan.webp", label: "12-week plan" },
        { src: "/work/drill/7-progress.webp", label: "Progress" },
      ],
    },
  },
  {
    slug: "printledger",
    title: "PrintLedger",
    category: "Web app · 3D print pricing",
    status: "Open source",
    stack: ["TypeScript", "React", "Vite", "Single-file build"],
    summary:
      "A pricing calculator and sales ledger for 3D-printing shops. Enter grams and hours and get a quote built from your own costs. One HTML file, no account, no server.",
    highlights: [
      "Prices any job from filament, printer wattage and run time, labour, packaging and margin, in each shop's own currency and rates",
      "Ledger with paid and printed tracking, CSV export, customer bills as images, and optional sync through the shop's own Firebase",
    ],
    links: [{ label: "Code", href: "https://github.com/nihalayoob07/printledgerv2" }],
    preview: {
      kind: "app",
      src: "/demos/printledger.html",
      poster: { src: "/work/printledger.webp", width: 1600, height: 1000 },
      url: "PrintLedger · live demo",
    },
  },
  {
    slug: "nova",
    title: "NOVA",
    category: "Hackathon · team project",
    stack: ["React", "Vite", "Supabase", "Vercel"],
    summary: "A campus platform for SJEC students to find activities, learn from peers and meet people with the same interests.",
    highlights: [
      "Built the Supabase backend (database and auth) and the Activities, Learn and Connect sections",
      "College-specific student verification so only SJEC students can join",
    ],
    links: [
      { label: "Live demo", href: "https://nova-hackathon-eta.vercel.app" },
      { label: "Code", href: "https://github.com/cursednight774-glitch/NOVA-Hackathon" },
    ],
    preview: { kind: "phone", screens: [{ src: "/work/nova.webp", label: "Today's activities" }] },
  },
  {
    slug: "invoicer",
    title: "Invoice Automation",
    category: "Chrome extension",
    status: "In daily use",
    stack: ["Chrome MV3", "JavaScript", "Node.js tests"],
    summary:
      "Automates a trading company's GST billing: an order line posted in WhatsApp becomes an e-invoice and e-way bill, with the PDF sent back.",
    highlights: [
      "Reads order lines from WhatsApp Web, fills and issues the invoice in the accounting software, and posts the PDF back to the group",
      "Dry-run by default, grand-total check before issuing, duplicate protection and fuzzy matching for misspelt names",
    ],
    links: [],
    privateRepo: true,
    preview: { kind: "poster", poster: "flow" },
  },
  {
    slug: "evofox",
    title: "EvoFox Ronin plugin",
    category: "Hardware reverse engineering",
    stack: ["JavaScript", "USB HID", "SignalRGB"],
    summary: "A SignalRGB plugin for a keyboard that had no support, written after decoding its LED protocol.",
    highlights: [
      "Worked out the packet structure, framing and start-up sequence from captured USB traffic",
      "Live per-key colour control, built from scratch",
    ],
    links: [],
    preview: { kind: "poster", poster: "keyboard" },
  },
  {
    slug: "infrastructure",
    title: "Self-hosted infrastructure",
    category: "DevOps · Linux",
    status: "In production",
    stack: ["Fedora Server", "Docker Compose", "Cloudflare Tunnel", "Caddy", "SELinux"],
    summary: "The production environment behind ThePrint.Vault: a self-managed Fedora server built to run unattended.",
    highlights: [
      "Containerised Next.js service with a multi-stage build, non-root user, health checks and memory limits, restarted automatically by Docker Compose",
      "Ingress through a Cloudflare Tunnel with no open ports behind carrier-grade NAT; Caddy adds automatic HTTPS, HSTS and security headers",
      "Secrets injected at runtime, rotating SQLite snapshots via VACUUM INTO, and one-command deploys that preserve all order data",
    ],
    links: [],
    preview: { kind: "poster", poster: "server" },
  },
];
