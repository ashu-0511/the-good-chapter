import type { MediaKey } from "./media";

/** Captions describe the kind of work, not specific (fictional) clients. */
export const gallery: { media: MediaKey; title: string; tag: string }[] = [
  { media: "varsityRed", title: "Campus varsity", tag: "Varsity · Chenille" },
  { media: "screenPrinting", title: "On the press", tag: "Screen print" },
  { media: "hoodieStudio", title: "Team hoodies", tag: "Fleece · Chest print" },
  { media: "embroideryHoop", title: "Stitch by stitch", tag: "Embroidery" },
  { media: "collegeSweatshirt", title: "Class of forever", tag: "College merch" },
  { media: "foldedStock", title: "Folded & ready", tag: "Fulfilment" },
  { media: "beigeSweatshirt", title: "Quiet essentials", tag: "Crewneck · Tonal" },
  { media: "hoodiesDuo", title: "Worn together", tag: "Hoodies" },
  { media: "kraftBox", title: "The unboxing", tag: "Packaging" },
];
