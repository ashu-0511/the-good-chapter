export type CustomStep = {
  id: "base" | "fabric" | "color" | "print" | "embroidery" | "finish";
  label: string;
  title: string;
  text: string;
  specs: string[];
};

export const customSteps: CustomStep[] = [
  {
    id: "base",
    label: "Base",
    title: "Start with the right blank.",
    text: "Fit, weight and silhouette first. Oversized, boxy, classic — the shape sets the tone for everything after.",
    specs: ["Silhouette", "Fit & grading", "Size run XS–4XL"],
  },
  {
    id: "fabric",
    label: "Fabric",
    title: "Choose what it feels like.",
    text: "Brushed fleece, French terry, heavyweight jersey. We match the hand-feel to how and where it will be worn.",
    specs: ["Brushed-back fleece", "French terry", "Garment-dyed"],
  },
  {
    id: "color",
    label: "Color",
    title: "Make it unmistakably yours.",
    text: "Custom-matched colourways, contrast trims and tonal details — tuned to your brand, not a swatch book.",
    specs: ["Pantone-matched dye", "Contrast trims", "Tonal hardware"],
  },
  {
    id: "print",
    label: "Print",
    title: "Say it out loud.",
    text: "Screen print, puff, DTF or high-density — the right technique for the artwork, the fabric and the run size.",
    specs: ["Screen print", "Puff & high-density", "DTF"],
  },
  {
    id: "embroidery",
    label: "Embroidery",
    title: "Or stitch it in for good.",
    text: "Satin stitch, chenille and 3D puff embroidery for crests, monograms and marks that last as long as the memory.",
    specs: ["Satin & fill stitch", "Chenille", "3D puff"],
  },
  {
    id: "finish",
    label: "Finish",
    title: "Finished like it matters.",
    text: "Sleeve hits, woven neck labels, hang tags and packaging that makes opening the box part of the moment.",
    specs: ["Woven labels", "Hang tags", "Custom packaging"],
  },
];
