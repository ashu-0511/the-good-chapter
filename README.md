# The Good Chapter — website

One-page marketing site for **The Good Chapter**, a premium custom merchandise and corporate gifting studio, plus a [digital business card](#digital-business-card) at `/card/`.
It is not a store: there is no cart, no pricing and no product pages. Every path leads to one action, **Start your chapter**.

The page reads like a book. Each section is a numbered chapter:

| # | Chapter | Section id |
|---|---------|------------|
| — | Hero — *Worn. Sipped. Written. Lit. Remembered.* | `#top` |
| 01 | The belief — *Merch isn't just merch.* | `#belief` |
| 02 | The range — eight product panels, apparel and gifts (live 3D) | `#products` |
| 03 | The craft — scroll-driven customisation reveal | `#craft` |
| 04 | The process — five-step timeline | `#process` |
| 05 | The work — editorial gallery + lightbox | `#work` |
| 06 | The people — colleges / startups / corporates / events | `#people` |
| 07 | The proof — stats, client types, testimonials | `#proof` |
| 08 | The why — manifesto + four qualities | `#about` |
| 09 | Yours — final CTA over a fabric shader | `#contact` |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → ./out
npm run start      # serve ./out locally
npm run lint && npm run typecheck
```

`next build` writes a fully static site to `out/`. You can deploy that folder to any static host (Vercel, Netlify, Cloudflare Pages, S3).

**Stack:** Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, three.js + React Three Fiber + drei, GSAP (ScrollTrigger) and Lenis.
`three` is pinned to **0.182** on purpose: newer releases deprecate `THREE.Clock`, which R3F 9 still uses, and that logs a console warning on every load.

## Editing content

All copy and media live in `src/content/`. You shouldn't need to touch any components to edit content.

| File | What's in it |
|------|--------------|
| `site.ts` | Name, domain, email, WhatsApp number, social links, nav, chapter titles, `markPlaceholders` flag |
| `products.ts` | The eight product panels (apparel and gifts) and their explore sheets (materials, techniques, colours) |
| `card.ts` | The digital business card: name, role, phone, messenger links, greeting |
| `customization.ts` | The six craft steps (Base → Finish) |
| `process.ts` | The five process steps |
| `gallery.ts` | Which photos appear in *The work*, with captions |
| `audiences.ts` | Colleges / Startups / Corporates / Events cards and their email subjects |
| `proof.ts` | Stats, client logos, testimonials |
| `qualities.ts` | The four manifesto qualities |
| `media.ts` | **Every photograph on the site**: URL, alt text, aspect ratio, focal point, credit |

### Before launch: replace the placeholders

- [ ] **Domain:** set `site.url` in `site.ts`. It's used for the canonical URL, Open Graph, `robots.txt` and `sitemap.xml`.
- [x] **Socials:** Instagram and LinkedIn URLs are configured in `site.socials`.
- [ ] **WhatsApp (optional):** add a number to `site.whatsapp` to point "Talk to us" at WhatsApp instead of email.
- [ ] **Stats:** put real numbers in `proof.ts` → `stats`, then set `placeholder: false`.
- [ ] **Testimonials:** put real quotes, names and roles in `proof.ts` → `testimonials`.
- [ ] **Client logos:** add `{ name, src }` entries to `proof.ts` → `clientLogos`. The marquee switches from client *types* to logos automatically.
- [ ] **Photography:** swap the Unsplash placeholders in `media.ts` for your own shoot. You can use a URL or a file in `/public`, e.g. `"/work/varsity.jpg"`. Update `alt`, `ratio` and `focus` too.
- [ ] **Finally:** set `markPlaceholders: false` in `site.ts` to remove the small "Placeholder" tags.

## Digital business card

`/card/` is Kanika's card: **Save contact**, one-tap WhatsApp, Telegram, Signal, Messages, call and email, links, and a QR code / share buttons to pass the card on. Everything on it comes from `src/content/card.ts`.

- **Save contact** opens `/card/contact.vcf`, a vCard built at export by `src/app/card/contact.vcf/route.tsx` (with the TG monogram as the contact photo). Phones open it straight into "Add contact"; WhatsApp and the other number-based messengers find the contact from there. Your host must serve `.vcf` as `text/vcard` (Vercel, Netlify and Cloudflare do by default).
- The QR code is drawn at build time (no script on the page). Print it or the `/card/` link on the physical card.
- The page is `noindex` (it carries a personal number) and loads none of the homepage's 3D, GSAP or smooth-scroll code.

## How the visuals work

**No 3D model files are needed.** Every product is generated in code from a few measurements. Garments come from pattern measurements in `src/components/webgl/garments/shapes.ts`:

1. **`shapes.ts`**: a garment outline (tee, hoodie, varsity, jacket, polo, crewneck), shared by every renderer.
2. **`painter.ts`**: paints ribs, seams, stitching, pockets, zips, prints and embroidery onto a canvas. This canvas is the 3D texture, and also the 2D fallback image.
3. **`buildGeometry.ts`**: inflates the outline into a soft 3D mesh. It uses a Delaunay mesh with height from distance-to-edge and analytic normals.
4. **`material.ts`**: fabric material with sheen, a procedural knit normal map and a studio environment (no network assets).

Gifts (bottle, diary, candle, gift box) come from `webgl/gifts/shapes.ts`: lathe and box geometry in `Gift.tsx`, with the logo printed, foiled or labelled by `gifts/painter.ts`, which also paints their 2D fallbacks.

| Where | What renders it |
|-------|-----------------|
| Hero | `HeroScene.tsx`: floating garments, cursor-driven camera and light, hover lift, scroll drift |
| Products | `ProductCanvas.tsx` + `ProductView.tsx`: **one** WebGL context draws all eight panels via drei `<View>` |
| Craft | `HoodieSVG.tsx` + `Customization.tsx`: SVG tech-pack hoodie on a scroll-scrubbed GSAP timeline |
| Final CTA | `FabricSurface.tsx`: single-pass fragment shader (draped folds, cursor bulge, twill weave) |

To change a product's colours, edit `products.ts` for the product panels, or `HERO_COLORS` in `HeroScene.tsx` for the hero.

### Performance and fallbacks

- three.js is **lazy-loaded**, so the first page load has no WebGL cost. Each scene mounts near the viewport and stops rendering when off-screen or when the tab is hidden.
- **One shader program for every lit surface.** Fabric, steel, paper, ceramic and ribbon all come from `makeSurface()` in `material.ts` and differ only in uniforms. Shader compiles are the most expensive part of a first render, so give new materials the same features rather than turning clearcoat, double-sided and the like on for one object.
- Models compile their shaders in the background before they appear (`useCompiledReveal`), and the range adds its models one per idle moment.
- `lib/capabilities.ts` picks a quality tier (high / medium / low / none) from WebGL support, device memory, CPU cores, pointer type and data-saver. Phones get fewer garments, lower-resolution meshes and textures, and a capped pixel ratio. The hero drops its pixel ratio if the frame rate is poor.
- **No WebGL** (or a lost context, or data-saver) switches to painted 2D garments with the same shapes and artwork. Add `?nogl` to the URL to preview this.
- **Reduced motion** turns off smooth scrolling, the custom cursor, magnetic buttons and the scroll/camera moves. Scenes render a single static frame.

## Accessibility and SEO

- There's one `<h1>`, an `<h2>` per chapter, a skip link and visible focus rings.
- Dialogs (menu, product sheets, lightbox) use native `<dialog>`, so focus is trapped, Esc closes them and focus returns to what opened them.
- Every photo has alt text, and canvases carry labels.
- The site has a title, description, Open Graph and Twitter cards (the image is generated at build time by `src/app/opengraph-image.tsx`), JSON-LD `Organization`, `robots.txt` and `sitemap.xml`.

## Project structure

```
src/
  app/            layout (fonts, metadata, JSON-LD), page, card/ (digital card + vCard), globals.css (design tokens), OG image, favicon, robots, sitemap
  content/        all copy + media (edit here)
  lib/            gsap setup, capability tiers, hooks, image loader, mailto and vCard builders
  components/
    layout/       Navbar, MobileMenu, Footer, ChapterIndicator
    sections/     Hero, Statement, ProductShowcase, Customization, Process, Gallery, Audience, Trust, Manifesto, CTA
    ui/           Logo, Monogram, MagneticButton, Cursor, Lines, Dialog, Marquee, RevealController, PlaceholderTag
    webgl/        garments/*, gifts/*, Garment, Gift, ProductModel, HeroScene, ProductCanvas, ProductView, ProductFallback, FabricSurface
    card/         the /card/ page's icons and share buttons
```

The design tokens (colours, type scale, spacing) live in `src/app/globals.css` under `@theme`.
The accent is burnt orange `#c8552b`. Use `#b84a22` behind ivory text so it stays readable.
