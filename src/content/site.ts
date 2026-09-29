/**
 * Global site configuration.
 * Everything a non-developer is likely to change lives here.
 */
export const site = {
  name: "The Good Chapter",
  /** PLACEHOLDER domain — update before launch (used for canonical URL, OG, sitemap). */
  url: "https://thegoodchapter.in",
  title: "The Good Chapter — Custom Merchandise & Corporate Gifting",
  description:
    "The Good Chapter creates premium custom merchandise and corporate gifts — apparel, water bottles, diaries, candles and curated gift boxes — for teams, brands, colleges and moments worth remembering.",
  tagline: "Made for moments worth remembering.",
  email: "hello@thegoodchapter.in",
  /**
   * WhatsApp number, digits only incl. country code (e.g. "919876543210").
   * Leave empty and "Talk to us" falls back to email.
   */
  whatsapp: "",
  socials: {
    instagram: "https://www.instagram.com/the.goodchapter/",
    linkedin: "https://www.linkedin.com/company/good-chapter/",
  },
  /**
   * While true, placeholder stats / testimonials / photos show a small
   * "Placeholder" tag so nobody mistakes them for real claims.
   * Flip to false once real content is in.
   */
  markPlaceholders: true,
} as const;

export type NavItem = { label: string; href: `#${string}` };

/** In page order, so the nav reads top to bottom like the page. */
export const nav: NavItem[] = [
  { label: "Products", href: "#products" },
  { label: "Process", href: "#process" },
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

/** The page reads like a book — every section is a chapter. */
export const chapters = [
  { id: "belief", n: "01", title: "The belief" },
  { id: "products", n: "02", title: "The range" },
  { id: "craft", n: "03", title: "The craft" },
  { id: "process", n: "04", title: "The process" },
  { id: "work", n: "05", title: "The work" },
  { id: "people", n: "06", title: "The people" },
  { id: "proof", n: "07", title: "The proof" },
  { id: "about", n: "08", title: "The why" },
  { id: "contact", n: "09", title: "Yours" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

export function chapter(id: ChapterId) {
  const c = chapters.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown chapter ${id}`);
  return c;
}
