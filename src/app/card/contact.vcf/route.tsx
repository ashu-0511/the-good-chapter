import { ImageResponse } from "next/og";
import { LOGO_CLAY } from "@/components/ui/Logo";
import { MONOGRAM } from "@/components/ui/Monogram";
import { card } from "@/content/card";
import { buildVCard } from "@/lib/vcard";

export const dynamic = "force-static";

/**
 * The contact's picture: the TG monogram in clay on ivory. Phones crop it to
 * a circle, so the mark stays well inside it.
 */
async function photo() {
  const size = 320;
  const mark = Math.round(size * 0.6);
  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f1ea" }}>
        <svg width={mark} height={mark} viewBox={MONOGRAM.viewBox}>
          <path d={MONOGRAM.d} fill={LOGO_CLAY} fillRule="evenodd" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
  return Buffer.from(await png.arrayBuffer()).toString("base64");
}

/** "Save contact" on /card/. Built once at export as a static /card/contact.vcf. */
export async function GET() {
  return new Response(buildVCard(card, await photo()), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'inline; filename="kanika-puri-the-good-chapter.vcf"',
    },
  });
}
