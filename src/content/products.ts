import type { ProductKind } from "@/components/webgl/models";

export type Product = {
  id: string;
  n: string;
  name: string;
  /** singular, for "Start with …" */
  short: string;
  /** which 3D / 2D model renders it */
  kind: ProductKind;
  /** panel backdrop (CSS color) and hover shift */
  backdrop: string;
  backdropHover: string;
  /** dark backdrop → light text on the panel */
  dark?: boolean;
  /** palette for the rendered piece: main surface, secondary (lid / trim / ribbon), print */
  colors: { body: string; trim?: string; accent?: string };
  line: string;
  description: string;
  materials: string[];
  techniques: string[];
  goodFor: string[];
};

/**
 * The range — apparel and gifting, alternated so neither reads as an
 * afterthought. Spec ranges below are typical starting points — edit to
 * match what the studio actually offers.
 */
export const products: Product[] = [
  {
    id: "hoodies",
    n: "01",
    name: "Hoodies & Sweatshirts",
    short: "hoodies",
    kind: "hoodie",
    backdrop: "#d9d2c5",
    backdropHover: "#cfc6b6",
    colors: { body: "#1d1d1b", trim: "#141413", accent: "#c8552b" },
    line: "Heavy fleece, clean lines — the piece people actually keep.",
    description:
      "Dense brushed fleece, structured hoods and embroidery that holds its shape wash after wash. Hoodies, crewnecks and zip-ups, made to be lived in.",
    materials: ["320–450 GSM brushed fleece", "French terry", "Garment-dyed finishes"],
    techniques: ["Embroidery", "Chenille patches", "Screen print", "Sleeve prints"],
    goodFor: ["Startup teams", "Graduating batches", "Crews & communities"],
  },
  {
    id: "water-bottles",
    n: "02",
    name: "Water Bottles",
    short: "water bottles",
    kind: "bottle",
    backdrop: "#d6ccba",
    backdropHover: "#cdc1ab",
    colors: { body: "#ebe5d8", trim: "#2a2926", accent: "#151514" },
    line: "Insulated, powder-coated and on every desk by Monday.",
    description:
      "Double-wall steel bottles, tumblers and mugs that keep things cold all day and hot through a shift — branded to outlast the drink inside.",
    materials: ["Double-wall 304 steel", "Powder-coat & matte finishes", "Bamboo & steel lids"],
    techniques: ["Laser engraving", "UV print", "Pad print", "Custom colourways"],
    goodFor: ["Onboarding kits", "Offsites & retreats", "Wellness drives"],
  },
  {
    id: "diaries",
    n: "03",
    name: "Diaries & Notebooks",
    short: "diaries",
    kind: "diary",
    backdrop: "#e4dccd",
    backdropHover: "#dcd1bd",
    colors: { body: "#1f1f1d", trim: "#c9a66b", accent: "#c8552b" },
    line: "Where the next chapter gets written — literally.",
    description:
      "Hardbound diaries, planners and notebooks in vegan leather, linen and kraft — foiled, debossed and finished with elastic bands and ribbon markers.",
    materials: ["Vegan leather & linen covers", "80–120 GSM ivory paper", "Dated, ruled or dot grid"],
    techniques: ["Foil stamping", "Blind deboss", "Custom inner pages", "Elastic & ribbon colours"],
    goodFor: ["New-year gifting", "Leadership & clients", "Conferences"],
  },
  {
    id: "varsity-jackets",
    n: "04",
    name: "Varsity Jackets",
    short: "varsity jackets",
    kind: "varsity",
    backdrop: "#ebe3d5",
    backdropHover: "#f0dccd",
    colors: { body: "#c8552b", trim: "#efe8da", accent: "#151514" },
    line: "Heritage silhouettes, rewritten with your letters.",
    description:
      "Wool-blend bodies, contrast sleeves and chenille lettering — a jacket that carries a year, a team or a class for good.",
    materials: ["Wool-blend body", "PU leather or melton sleeves", "Striped rib trims"],
    techniques: ["Chenille letters", "Felt patches", "Back embroidery", "Custom snaps"],
    goodFor: ["Graduating batches", "Sports teams", "Clubs & fraternities"],
  },
  {
    id: "candles",
    n: "05",
    name: "Candles",
    short: "candles",
    kind: "candle",
    backdrop: "#e9e4da",
    backdropHover: "#e2dbcd",
    colors: { body: "#a2552c", trim: "#f1ebdf", accent: "#151514" },
    line: "Hand-poured scent that makes the gift linger.",
    description:
      "Soy-wax candles in glazed ceramic, glass and tin — scents blended for the occasion, labels designed around your brand, packed to arrive intact.",
    materials: ["Soy & coconut wax", "Ceramic, glass & tin vessels", "Cotton & wooden wicks"],
    techniques: ["Custom scent blends", "Printed labels", "Etched vessels", "Gift sleeves"],
    goodFor: ["Festive gifting", "Client thank-yous", "Weddings & milestones"],
  },
  {
    id: "t-shirts",
    n: "06",
    name: "T-Shirts & Polos",
    short: "T-shirts",
    kind: "tee",
    backdrop: "#e7e0d2",
    backdropHover: "#e0d6c4",
    colors: { body: "#ece6da", trim: "#dcd3c2", accent: "#c8552b" },
    line: "Oversized, boxy or classic. The blank page every chapter starts on.",
    description:
      "Heavyweight oversized drops, crisp everyday fits and structured polos — cut, printed and finished so they still feel right on the hundredth wear.",
    materials: ["180–240 GSM combed cotton", "Piqué & performance knits", "Organic & blended options"],
    techniques: ["Screen print", "Puff print", "DTF", "Embroidery"],
    goodFor: ["Fests & launches", "Team drops", "Uniforms"],
  },
  {
    id: "corporate-jackets",
    n: "07",
    name: "Corporate Jackets",
    short: "corporate jackets",
    kind: "jacket",
    backdrop: "#d3d0c9",
    backdropHover: "#c9c6be",
    colors: { body: "#2f3236", trim: "#24272a", accent: "#c8552b" },
    line: "Sharp, understated outerwear your team will actually wear.",
    description:
      "Softshells, bombers and quilted layers with tonal branding — quiet enough for the boardroom, good enough for the weekend.",
    materials: ["Softshell & bonded fleece", "Water-resistant shells", "Quilted linings"],
    techniques: ["Tonal embroidery", "Heat-transfer logos", "Woven labels", "Custom zip pullers"],
    goodFor: ["Offsites", "Leadership gifting", "Client-facing teams"],
  },
  {
    id: "gift-boxes",
    n: "08",
    name: "Gift Boxes & More",
    short: "a gift box",
    kind: "giftbox",
    backdrop: "#1f1f1d",
    backdropHover: "#262624",
    dark: true,
    colors: { body: "#efe8da", trim: "#c8552b", accent: "#151514" },
    line: "Curated kits — mugs, totes, desk pieces and anything else with a story.",
    description:
      "The whole chapter in one box: bottles, diaries, candles, apparel and the small things — mugs, totes, caps, desk pieces — packed in rigid boxes designed for the unboxing.",
    materials: ["Rigid & kraft boxes", "Mugs, totes, caps & desk pieces", "Tissue, sleeves & notes"],
    techniques: ["Curation", "Custom packaging", "Personalised notes", "Pan-India dispatch"],
    goodFor: ["Welcome kits", "Festive & Diwali gifting", "Anything with a story"],
  },
];
