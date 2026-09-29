import type { MediaKey } from "./media";

export const qualities: { n: string; title: string; text: string; media: MediaKey }[] = [
  { n: "01", title: "Quality", text: "Premium materials & finishing.", media: "fabric" },
  { n: "02", title: "Craft", text: "Printing, embroidery, engraving & construction.", media: "sewing" },
  { n: "03", title: "Detail", text: "From first sketch to final stitch.", media: "threads" },
  { n: "04", title: "People", text: "Made around the people who keep it.", media: "hoodiePortrait" },
];
