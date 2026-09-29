/**
 * Media manifest — every photograph on the site is declared here.
 *
 * All current entries are PLACEHOLDER editorial photography from Unsplash
 * (free license, visually vetted). To swap one for a real shoot, replace
 * `src` with the new URL (or a file in /public, e.g. "/work/varsity.jpg"),
 * update `alt`, set `ratio` to width / height and flip `placeholder` off.
 */
export type Media = {
  src: string;
  alt: string;
  /** width / height of the source image */
  ratio: number;
  /** focal point for object-position, e.g. "50% 30%" */
  focus?: string;
  credit?: string;
  placeholder?: boolean;
};

const unsplash = (path: string) => `https://images.unsplash.com/${path}`;

export const media = {
  varsityRed: {
    src: unsplash("photo-1749534472739-c038cdf0a63f"),
    alt: "A man in a red and white varsity jacket standing on grey cobblestones, shot from above.",
    ratio: 2 / 3,
    focus: "50% 45%",
    credit: "https://unsplash.com/photos/yC8TNpnKBZE",
    placeholder: true,
  },
  hoodieStudio: {
    src: unsplash("photo-1652823780977-b22c0ed84c97"),
    alt: "A man crouching in a black printed hoodie against a white studio wall.",
    ratio: 2 / 3,
    focus: "50% 35%",
    credit: "https://unsplash.com/photos/XEmkHQXAHFs",
    placeholder: true,
  },
  screenPrinting: {
    src: unsplash("photo-1456456496250-d5e7c0a9b44d"),
    alt: "Hands pulling a squeegee across a wooden screen-printing frame by a window.",
    ratio: 3 / 2,
    focus: "40% 60%",
    credit: "https://unsplash.com/photos/ZCTh4f4mv18",
    placeholder: true,
  },
  collegeSweatshirt: {
    src: unsplash("photo-1712396268156-aa35dc6d6151"),
    alt: "A student in an oversized green collegiate sweatshirt with white varsity lettering.",
    ratio: 2 / 3,
    focus: "50% 40%",
    credit: "https://unsplash.com/photos/EAAvgbNBZtE",
    placeholder: true,
  },
  foldedStock: {
    src: unsplash("photo-1753369232904-a8a888319d28"),
    alt: "Neatly folded shirts in sand and blush tones stacked on wooden shelves.",
    ratio: 4 / 3,
    focus: "50% 50%",
    credit: "https://unsplash.com/photos/4JeCx1lZAQQ",
    placeholder: true,
  },
  embroideryHoop: {
    src: unsplash("photo-1671535108620-d169ce916f09"),
    alt: "Close-up of floral embroidery in a wooden hoop on black cloth, beside gold scissors.",
    ratio: 3 / 2,
    focus: "45% 50%",
    credit: "https://unsplash.com/photos/GkwoMPCmwDs",
    placeholder: true,
  },
  beigeSweatshirt: {
    src: unsplash("photo-1759229874914-c1ffdb3ebd0c"),
    alt: "A woman in a soft beige raglan sweatshirt against warm wood panelling.",
    ratio: 4 / 3,
    focus: "50% 35%",
    credit: "https://unsplash.com/photos/rz3sw-8VNCw",
    placeholder: true,
  },
  kraftBox: {
    src: unsplash("photo-1575833948662-cc99178abbb8"),
    alt: "An open kraft cardboard box photographed from above on a pale background.",
    ratio: 3 / 2,
    focus: "50% 50%",
    credit: "https://unsplash.com/photos/_JBGjZFFYRk",
    placeholder: true,
  },
  hoodiesDuo: {
    src: unsplash("photo-1514435116008-a80913c597af"),
    alt: "Two friends in hoodies standing against a dark wall.",
    ratio: 3 / 2,
    focus: "50% 40%",
    credit: "https://unsplash.com/photos/hUHyeZ2CVUs",
    placeholder: true,
  },
  campus: {
    src: unsplash("photo-1760111085279-6c4b6d831acc"),
    alt: "Students walking through a stone university archway on a bright winter day.",
    ratio: 3 / 2,
    focus: "50% 55%",
    credit: "https://unsplash.com/photos/MUiv880yORo",
    placeholder: true,
  },
  startupTeam: {
    src: unsplash("photo-1522071820081-009f0129c71c"),
    alt: "A small team working together around a wooden table with laptops.",
    ratio: 3 / 2,
    focus: "50% 50%",
    credit: "https://unsplash.com/photos/QckxruozjRg",
    placeholder: true,
  },
  corporateRack: {
    src: unsplash("photo-1745284505024-1ac4453a67b2"),
    alt: "Tailored jackets and shirts in soft neutral tones hanging on a black rail.",
    ratio: 2 / 3,
    focus: "50% 55%",
    credit: "https://unsplash.com/photos/tyllGRM7zPc",
    placeholder: true,
  },
  eventCrowd: {
    src: unsplash("photo-1603190287605-e6ade32fa852"),
    alt: "A festival crowd with hands raised into warm, hazy stage light.",
    ratio: 3 / 2,
    focus: "50% 88%",
    credit: "https://unsplash.com/photos/Qnlp3FCO2vc",
    placeholder: true,
  },
  fabric: {
    src: unsplash("photo-1686806374120-e7ae3f19801d"),
    alt: "Macro view of a woven cream fabric texture.",
    ratio: 2 / 3,
    focus: "50% 50%",
    credit: "https://unsplash.com/photos/QFQ6vsou7XA",
    placeholder: true,
  },
  sewing: {
    src: unsplash("photo-1560796952-f1c9b838544c"),
    alt: "Black-and-white close-up of a sewing machine needle stitching fabric.",
    ratio: 3 / 2,
    focus: "40% 50%",
    credit: "https://unsplash.com/photos/tabzu_kbVs0",
    placeholder: true,
  },
  threads: {
    src: unsplash("photo-1758221311831-25a3ec89253d"),
    alt: "Wooden spools of thread in blues, creams and pinks scattered on a white surface.",
    ratio: 5 / 4,
    focus: "50% 50%",
    credit: "https://unsplash.com/photos/5EnuMMVtFbk",
    placeholder: true,
  },
  hoodiePortrait: {
    src: unsplash("photo-1660048079966-5db94255b2b5"),
    alt: "A young person in a sea-green hoodie leaning against a stone wall.",
    ratio: 2 / 3,
    focus: "50% 40%",
    credit: "https://unsplash.com/photos/sw2kEdeTy1Y",
    placeholder: true,
  },
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof media;
