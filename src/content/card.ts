import { site } from "./site";

/**
 * The digital business card at /card/.
 * The same details feed the page, the "Save contact" vCard and every
 * message link, so edit them here only.
 */
export const card = {
  name: "Kanika Puri",
  /** used where the card speaks casually ("Message Kanika") */
  firstName: "Kanika",
  /** job title under the name; leave empty to hide it */
  role: "Founder",
  company: site.name,
  /** shown on screen */
  phoneDisplay: "+91 97791 08083",
  /** digits only, country code first — used for tel:, WhatsApp, Signal, Telegram */
  phone: "919779108083",
  /** Telegram username without "@"; empty → Telegram opens the chat by phone number */
  telegram: "",
  email: site.email,
  website: site.url,
  instagram: site.socials.instagram,
  linkedin: site.socials.linkedin,
  /** first message, pre-filled in WhatsApp and Messages */
  greeting: "Hi Kanika, I got your card from The Good Chapter.",
  note: "Custom merchandise & corporate gifting — apparel, bottles, diaries, candles and gift boxes.",
} as const;

/** The card's own public address (trailing slash matches the static export). */
export const cardUrl = `${site.url}/card/`;
