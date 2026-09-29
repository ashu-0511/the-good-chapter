import { site } from "@/content/site";

/** Build a mailto: link. Encodes manually — URLSearchParams turns spaces into "+". */
export function mailto({ subject, body }: { subject?: string; body?: string } = {}) {
  const q: string[] = [];
  if (subject) q.push(`subject=${encodeURIComponent(subject)}`);
  if (body) q.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${site.email}${q.length ? `?${q.join("&")}` : ""}`;
}

export const briefTemplate = [
  "Hi The Good Chapter,",
  "",
  "Here's what we're thinking —",
  "",
  "What we'd like to make: ",
  "Who it's for (team / college / event / brand): ",
  "Rough quantity: ",
  "Needed by: ",
  "Anything else (references, colours, links): ",
  "",
  "Thanks!",
].join("\n");

export function startChapterHref(what?: string) {
  return mailto({
    subject: what ? `Starting our chapter — ${what}` : "Starting our chapter",
    body: briefTemplate.replace("What we'd like to make: ", `What we'd like to make: ${what ?? ""}`),
  });
}

export function talkHref() {
  return site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi The Good Chapter — ")}`
    : mailto({ subject: "Hello from the website" });
}
