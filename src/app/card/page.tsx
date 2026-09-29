import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import type { ComponentType, SVGProps } from "react";
import { Globe, Instagram, LinkedIn, Mail, Message, Phone, Signal, Telegram, UserPlus, WhatsApp } from "@/components/card/CardIcons";
import { ShareCard } from "@/components/card/ShareCard";
import { ArrowUpRight } from "@/components/ui/Icons";
import { LOGO_CLAY, Logo } from "@/components/ui/Logo";
import { Monogram } from "@/components/ui/Monogram";
import { card, cardUrl } from "@/content/card";
import { site } from "@/content/site";

const title = `${card.name} — ${card.company}`;
const description = `Save ${card.name}'s contact, or message her on WhatsApp, Telegram or Signal. ${card.note}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/card/" },
  // a personal phone number: reachable by link and QR, kept out of search results
  robots: { index: false, follow: true },
  openGraph: { title, description, url: "/card/" },
  twitter: { title, description },
};

/** QR modules as one path, merging each row's runs of dark modules. Built once at export. */
function qr(text: string) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = modules.size;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!modules.get(y, x)) continue;
      let run = 1;
      while (x + run < n && modules.get(y, x + run)) run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run - 1;
    }
  }
  return { n, d };
}

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

const tel = `+${card.phone}`;
const greeting = encodeURIComponent(card.greeting);

const messengers: { label: string; hint: string; href: string; Icon: Glyph; chip: string }[] = [
  { label: "WhatsApp", hint: "Chat now", href: `https://wa.me/${card.phone}?text=${greeting}`, Icon: WhatsApp, chip: "bg-[#1fa855]" },
  {
    label: "Telegram",
    hint: "Open chat",
    href: card.telegram ? `https://t.me/${card.telegram}` : `https://t.me/${tel}`,
    Icon: Telegram,
    chip: "bg-[#2481cc]",
  },
  { label: "Signal", hint: "Open chat", href: `https://signal.me/#p/${tel}`, Icon: Signal, chip: "bg-[#3a76f0]" },
  // `?&body=` is the form both iOS and Android Messages read
  { label: "Messages", hint: "Text", href: `sms:${tel}?&body=${greeting}`, Icon: Message, chip: "bg-graphite" },
  { label: "Call", hint: "Voice call", href: `tel:${tel}`, Icon: Phone, chip: "bg-graphite" },
  { label: "Email", hint: "Write", href: `mailto:${card.email}`, Icon: Mail, chip: "bg-accent-deep" },
];

const handle = (url: string) => "@" + url.replace(/\/+$/, "").split("/").pop();

const links: { label: string; value: string; href: string; Icon: Glyph }[] = [
  { label: "Website", value: card.website.replace(/^https?:\/\//, ""), href: card.website, Icon: Globe },
  { label: "Instagram", value: handle(card.instagram), href: card.instagram, Icon: Instagram },
  { label: "LinkedIn", value: card.company, href: card.linkedin, Icon: LinkedIn },
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Kanika's digital business card: save the contact, or message in one tap. */
export default function CardPage() {
  const code = qr(cardUrl);
  const shareText = `${card.name} · ${card.company}`;

  return (
    <main id="main" className="min-h-dvh bg-ivory pb-[max(2.5rem,env(safe-area-inset-bottom))] text-ink">
      <div className="mx-auto flex max-w-[440px] flex-col gap-8 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <header className="flex items-center justify-between">
          <Link href="/" prefetch={false} className={`rounded-sm ${focus}`}>
            <Logo label="The Good Chapter — visit the website" className="block h-9 w-auto" />
          </Link>
          <span className="text-label text-muted">Digital card</span>
        </header>

        {/* the printed card's front, reprised */}
        <div
          className="flex aspect-[7/4] flex-col items-center justify-center gap-4 rounded-[18px] text-ivory shadow-[0_24px_48px_-28px_rgba(21,21,20,0.55)]"
          style={{ backgroundColor: LOGO_CLAY }}
        >
          <Monogram className="h-auto w-[26%]" />
          <p className="text-label">Merchandise &amp; corporate gifting</p>
        </div>

        <div>
          <h1 className="font-display text-[3rem] font-semibold uppercase leading-[0.9] tracking-[-0.05em]">{card.name}</h1>
          <p className="mt-3 text-[15px] text-muted">
            {card.role ? `${card.role}, ${card.company}` : card.company} · {card.phoneDisplay}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/card/contact.vcf"
            className={`flex h-14 items-center justify-center gap-3 rounded-full bg-ink text-[15px] font-medium text-ivory transition-colors hover:bg-graphite ${focus}`}
          >
            <UserPlus className="size-5" />
            Save contact
          </a>
          <p className="px-2 text-center text-[13px] leading-snug text-muted">
            Adds {card.firstName} to your phone&apos;s contacts. WhatsApp, Telegram and Signal pick her up from there.
          </p>
        </div>

        <section aria-labelledby="message-title">
          <h2 id="message-title" className="text-label text-muted">
            Message {card.firstName}
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">
            {messengers.map(({ label, hint, href, Icon, chip }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl bg-paper p-3 ring-1 ring-ink/10 transition-[box-shadow,transform] hover:ring-ink/25 active:scale-[0.98] ${focus}`}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-white ${chip}`}>
                    <Icon className="size-[22px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-tight">{label}</span>
                    <span className="block truncate text-[12.5px] text-muted">{hint}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="links-title">
          <h2 id="links-title" className="text-label text-muted">
            Find us
          </h2>
          <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
            {links.map(({ label, value, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`group flex min-h-14 items-center gap-3 py-2 ${focus}`}
                >
                  <Icon className="size-5 shrink-0 text-accent-deep" />
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">{label}: </span>
                    <span className="block truncate text-[15px]">{value}</span>
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="share-title" className="rounded-[18px] bg-paper p-5 ring-1 ring-ink/10">
          <h2 id="share-title" className="text-label text-muted">
            Share this card
          </h2>
          <div className="mt-4 flex items-center gap-5">
            <svg
              viewBox={`-2 -2 ${code.n + 4} ${code.n + 4}`}
              role="img"
              aria-label={`QR code for ${cardUrl}`}
              shapeRendering="crispEdges"
              className="size-32 shrink-0 rounded-lg bg-white"
            >
              <path d={code.d} fill="#151514" />
            </svg>
            <p className="text-[13.5px] leading-snug text-muted">
              Scan to open this card on another phone and save {card.firstName} in one tap.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ShareCard url={cardUrl} title={title} text={shareText} />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${cardUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium ring-1 ring-ink/15 transition-colors hover:bg-ink hover:text-ivory ${focus}`}
            >
              <WhatsApp className="size-[18px]" />
              Send on WhatsApp
            </a>
          </div>
        </section>

        <footer className="flex items-center justify-between text-[12.5px] text-muted">
          <Link href="/" prefetch={false} className={`rounded-sm hover:text-ink ${focus}`}>
            {card.website.replace(/^https?:\/\//, "")}
          </Link>
          <span>{site.tagline}</span>
        </footer>
      </div>
    </main>
  );
}
