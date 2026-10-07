export type Social = { label: string; href: string; icon: "github" | "linkedin" | "mail" };

export const site = {
  name: "Nihal Ayoob",
  fullName: "Mohammed Nihal Ayoob",
  initials: "NA",
  email: "mnihalayoob@gmail.com",
  location: "Mangalore, India",
  studying: "CSE @ SJEC",
  year: 2026,
  // Set to "/resume.pdf" once a copy without the phone number is in /public.
  resumeUrl: null as string | null,
  // Cut out by scripts/prepare-hero.mjs.
  heroImage: { src: "/me.webp", width: 1400, height: 1234 },
  roles: [
    { article: "An", word: "Engineer" },
    { article: "A", word: "Full-stack dev" },
    { article: "An", word: "Android dev" },
    { article: "A", word: "3D designer" },
  ],
  description:
    "First-year Computer Science student at SJEC, Mangalore. I build full-stack web apps, Android and desktop tools, and 3D-printed parts.",
  socials: [
    { label: "GitHub", href: "https://github.com/nihalayoob07", icon: "github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/mohammed-nihal-ayoob-b642453a7", icon: "linkedin" },
    { label: "Email", href: "mailto:mnihalayoob@gmail.com", icon: "mail" },
  ] satisfies Social[],
  nav: [
    { label: "About", href: "#about" },
    { label: "Work", href: "#work" },
    { label: "Models", href: "#models" },
    { label: "Contact", href: "#contact" },
  ],
};
