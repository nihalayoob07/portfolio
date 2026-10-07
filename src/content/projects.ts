export type ProjectLink = { label: string; href: string };

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
  image?: { src: string; alt: string; width: number; height: number };
  // Drawn in CSS when there's no screenshot to show.
  poster?: "server" | "flow" | "nova" | "keyboard";
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
    image: { src: "/work/printvault.webp", alt: "ThePrint.Vault home page", width: 1600, height: 1000 },
  },
  {
    slug: "home-server",
    title: "Home server",
    category: "Self-hosted infrastructure",
    status: "In production",
    stack: ["Fedora Server", "Docker Compose", "Cloudflare Tunnel", "Caddy", "SELinux"],
    summary: "An old PC turned into the Fedora server that runs ThePrint.Vault in production.",
    highlights: [
      "Multi-stage Docker build with a non-root user, health check and memory cap; survives reboots",
      "Cloudflare Tunnel gets around carrier-grade NAT with no open router ports; SQLite backups with VACUUM INTO and snapshot rotation",
    ],
    links: [],
    poster: "server",
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
    image: { src: "/work/deck.webp", alt: "Deck sending a file from the notch to a phone", width: 1600, height: 900 },
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
    image: { src: "/work/drill.webp", alt: "Drill feature graphic: the alarm that roasts you out of bed", width: 1024, height: 500 },
  },
  {
    slug: "invoicer",
    title: "Redstone Invoicer",
    category: "Chrome extension",
    status: "In daily use",
    stack: ["Chrome MV3", "JavaScript", "Node.js tests"],
    summary: "Automates a company's billing: WhatsApp order in, GST e-invoice and e-way bill out, PDF posted back to the group.",
    highlights: [
      "Reads order lines from WhatsApp Web, fills and issues the invoice in Livekeeping, and sends the PDF back",
      "Dry-run by default, grand-total check before issuing, duplicate protection and fuzzy matching for misspelt names",
    ],
    links: [],
    privateRepo: true,
    poster: "flow",
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
    poster: "nova",
  },
  {
    slug: "printledger",
    title: "PrintLedger",
    category: "Web app",
    status: "In daily use",
    stack: ["TypeScript", "Vite", "Single-file build", "localStorage"],
    summary: "The pricing calculator and sales ledger used to quote every ThePrint.Vault order. One HTML file, no account, no server.",
    highlights: [
      "Prices a job from filament, wattage and run time, labour, packaging and margin, using the shop's own figures",
      "Sales ledger with paid and printed tracking, CSV export, and bills exported as PNGs for customers",
    ],
    links: [{ label: "Code", href: "https://github.com/nihalayoob07/printledgerv2" }],
    image: { src: "/work/printledger.webp", alt: "PrintLedger's pricing console", width: 1600, height: 1000 },
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
    poster: "keyboard",
  },
];
