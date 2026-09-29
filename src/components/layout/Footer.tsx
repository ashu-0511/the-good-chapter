import { nav, site } from "@/content/site";
import { ArrowUpRight } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const year = 2026;
  const social = [
    { label: "Instagram", href: site.socials.instagram },
    { label: "LinkedIn", href: site.socials.linkedin },
  ];
  return (
    <footer data-nav="dark" className="relative overflow-hidden bg-ink px-gutter pb-8 pt-24 text-ivory md:pt-32">
      <div className="grid-12 gap-y-14">
        <div className="col-span-12 md:col-span-6">
          <p className="text-display-s max-w-[14ch] text-balance">{site.tagline}</p>
          <a
            href={`mailto:${site.email}`}
            className="group mt-8 inline-flex items-center gap-2 text-lead text-ivory/90"
            data-cursor="hover"
          >
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-700 ease-out-expo group-hover:bg-[length:100%_1px]">
              {site.email}
            </span>
            <ArrowUpRight className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        <nav aria-label="Footer" className="col-span-6 md:col-span-2 md:col-start-8">
          <p className="text-label mb-5 text-mist">Index</p>
          <ul className="space-y-2.5 text-[15px]">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="transition-colors hover:text-accent">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-6 md:col-span-2">
          <p className="text-label mb-5 text-mist">Elsewhere</p>
          <ul className="space-y-2.5 text-[15px]">
            {social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-accent">
                Email
              </a>
            </li>
          </ul>
        </div>

        <div className="col-span-12 flex md:col-span-1 md:justify-end">
          <a href="#top" className="text-label flex h-fit items-center gap-2 text-mist transition-colors hover:text-ivory">
            Top <span aria-hidden>↑</span>
          </a>
        </div>
      </div>

      <Logo className="mt-20 block h-auto w-full select-none text-ivory md:mt-28" />

      <div className="mt-8 flex flex-col justify-between gap-3 border-t border-ivory/15 pt-6 text-[12.5px] text-mist md:flex-row">
        <p>© {year} The Good Chapter. All rights reserved.</p>
        <p>Photography shown is placeholder imagery via Unsplash.</p>
      </div>
    </footer>
  );
}
