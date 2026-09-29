/**
 * vCard 3.0 — the version iOS, Android, Google and Outlook contacts all
 * import without complaint. Opening the file offers "Add to contacts";
 * WhatsApp and other phone-number messengers pick the contact up from there.
 */

type Contact = {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  linkedin: string;
  note: string;
};

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Lines past 75 characters fold onto continuation lines that start with a space (RFC 2425 §5.8.1). */
function fold(line: string) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(" " + line.slice(i, i + 74));
  return parts.join("\r\n");
}

/** `photoPng` is base64 PNG data, shown as the contact's picture. */
export function buildVCard(c: Contact, photoPng?: string) {
  const words = c.name.trim().split(/\s+/);
  const given = words.length > 1 ? words.slice(0, -1).join(" ") : words[0];
  const family = words.length > 1 ? words[words.length - 1] : "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(c.name)}`,
    `ORG:${esc(c.company)}`,
    c.role && `TITLE:${esc(c.role)}`,
    `TEL;TYPE=CELL,VOICE:+${c.phone}`,
    `EMAIL;TYPE=INTERNET,WORK:${c.email}`,
    `URL:${c.website}`,
    c.instagram && `X-SOCIALPROFILE;TYPE=instagram:${c.instagram}`,
    c.linkedin && `X-SOCIALPROFILE;TYPE=linkedin:${c.linkedin}`,
    `NOTE:${esc(c.note)}`,
    photoPng && `PHOTO;ENCODING=b;TYPE=PNG:${photoPng}`,
    "END:VCARD",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n") + "\r\n";
}
