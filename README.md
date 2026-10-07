# Portfolio

Personal portfolio of **Mohammed Nihal Ayoob**, a first-year Computer Science student at SJEC, Mangalore. It covers the software I've built and the parts I've designed for 3D printing, including an interactive viewer for the models.

## Stack

- **Next.js 16** (App Router, fully static) with **TypeScript** and **Tailwind CSS v4**
- **GSAP + ScrollTrigger** and **Lenis** for the scroll-driven animation; everything respects `prefers-reduced-motion`
- **three.js** via **React Three Fiber** and **drei** for the model viewer, which loads only when its section is near the viewport
- Hosted on **Vercel**

## Content

All text lives in `src/content/`:

| File          | What it holds                                           |
| ------------- | ------------------------------------------------------- |
| `site.ts`     | Name, email, socials, hero roles, resume link           |
| `projects.ts` | The work cards                                          |
| `timeline.ts` | Journey milestones                                      |
| `pillars.ts`  | The three "What I do" cards                             |
| `skills.ts`   | The tech stack grid (icons from `simple-icons`)         |
| `models.ts`   | Text for each 3D model (stats are generated, see below) |

## Asset scripts

Both scripts read source files from my machine and write the optimised results into `public/`.

```bash
# Bambu Studio .3mf projects -> compressed GLBs, thumbnails and stats
npm run prepare:models

# Backlit portrait -> transparent hero cut-out (public/me.webp)
npm run prepare:hero -- path/to/photo.jpg
```

`prepare:models` reads the list in `scripts/models.config.json`. It keeps each print plate's layout, simplifies parts above the triangle budget with meshoptimizer, and writes `src/content/models.generated.json`.

## Develop

```bash
npm install
npm run dev
```

`npm run build` produces a fully static site; `npm run lint` and `npm run format` keep the code tidy.
