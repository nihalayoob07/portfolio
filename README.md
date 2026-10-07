# Portfolio

Personal portfolio of **Mohammed Nihal Ayoob**, a first-year Computer Science student at SJEC, Mangalore. It covers the software I've built and the parts I've designed for 3D printing. Each featured project is a full-screen panel that plays a scroll-driven demo, and each print is rendered in real time.

## Stack

- **Next.js 16** (App Router, fully static) with **TypeScript** and **Tailwind CSS v4**
- **GSAP + ScrollTrigger** and **Lenis** for the scroll-driven animation; everything respects `prefers-reduced-motion`
- **three.js** via **React Three Fiber**, **drei** and **postprocessing** (N8AO ambient occlusion) for the print renders, which load only when their panel is near the viewport
- Hosted on **Vercel**

## Content

All text lives in `src/content/`:

| File          | What it holds                                           |
| ------------- | ------------------------------------------------------- |
| `site.ts`     | Name, email, socials, hero roles, resume link           |
| `projects.ts` | Featured work (with its reel) and the other projects    |
| `timeline.ts` | Journey milestones                                      |
| `pillars.ts`  | The three "What I do" cards                             |
| `skills.ts`   | The tech stack grid (icons from `simple-icons`)         |
| `models.ts`   | Text for each 3D model (stats are generated, see below) |

## Asset scripts

These scripts read source files or live pages and write the optimised results into `public/`.

```bash
# Bambu Studio .3mf projects -> compressed GLBs, thumbnails and stats
npm run prepare:models

# Backlit portrait -> transparent hero cut-out (public/me.webp)
npm run prepare:hero -- path/to/photo.jpg

# Screens and cursor targets for the Print Vault and PrintLedger reels (needs Edge;
# PrintLedger also needs `npm run dev` running)
npm run capture:reels

# Poster stills of each 3D print's opening frame (needs `npm run dev` running)
npm run capture:reels posters
```

`prepare:models` reads the list in `scripts/models.config.json`. It assembles each print from Bambu Studio's assembly data plus the hand-measured placements there, adds extras such as the clicker's keyboard switch and raised lettering, simplifies parts above the triangle budget with meshoptimizer, and writes `src/content/models.generated.json`.

`capture:reels` records each step of the flow as a still plus the page position of everything the demo cursor clicks or types into, in `src/content/reels/`. `posters` renders each 3D print's first frame from the running site, wide and portrait, into `public/models/posters/`: the panels show these straight away and the live 3D fades in over them, after the 3D code and every model have been loaded in the background once the page is idle. Print Vault is only read: its cart stays in the headless browser and the checkout is captured empty, with the typing added by the reel.

## Develop

```bash
npm install
npm run dev
```

`npm run build` produces a fully static site; `npm run lint` and `npm run format` keep the code tidy.
