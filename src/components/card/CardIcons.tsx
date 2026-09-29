import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export const UserPlus = (p: P) => (
  <Icon {...p}>
    <path d="M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6M22 11h-6" />
  </Icon>
);

export const WhatsApp = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" />
    <path
      d="M9.1 8.2c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.5.6c-.1.2-.1.3 0 .5a5.8 5.8 0 0 0 2.5 2.2c.2.1.3.1.5-.1l.6-.7c.1-.2.3-.2.5-.1l1.7.8c.2.1.3.2.3.4 0 .6-.3 1.2-.8 1.5-.6.4-1.4.5-2.4.1a9 9 0 0 1-4.9-4.6c-.5-1.3-.4-2.4.3-3.2z"
      fill="currentColor"
      stroke="none"
    />
  </Icon>
);

export const Telegram = (p: P) => (
  <Icon {...p}>
    <path d="M21 4.5 3.5 11.3l5.6 2 2.1 6.2 3.1-3.8 4.7 3.6L21 4.5z" />
    <path d="m9.1 13.3 8.3-6.3-6.2 8.7" />
  </Icon>
);

export const Signal = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" strokeDasharray="2.6 1.9" />
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
  </Icon>
);

export const Message = (p: P) => (
  <Icon {...p}>
    <path d="M20 12c0 4-3.6 7-8 7-1 0-2-.2-2.9-.5L4.5 20l1-3.6A6.8 6.8 0 0 1 4 12c0-4 3.6-7 8-7s8 3 8 7z" />
  </Icon>
);

export const Phone = (p: P) => (
  <Icon {...p}>
    <path d="M8.6 4.5 6.5 4c-.8 0-2.5.8-2.5 2.8C4 13.6 10.4 20 17.2 20c2 0 2.8-1.7 2.8-2.5l-.5-2.1-3.3-1.4-1.7 1.7a11 11 0 0 1-5.2-5.2l1.7-1.7L9.6 5.5z" />
  </Icon>
);

export const Mail = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);

export const Globe = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5z" />
  </Icon>
);

export const Instagram = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 7h.01" strokeWidth="2.2" />
  </Icon>
);

export const LinkedIn = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 10.5V16M8 7.9v.01M11.5 16v-5.5M11.5 13a2.5 2.5 0 0 1 5 0v3" />
  </Icon>
);

export const Share = (p: P) => (
  <Icon {...p}>
    <path d="M12 14.5V3.5M8 7l4-3.5L16 7M8.5 10.5H6.5A1.5 1.5 0 0 0 5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7a1.5 1.5 0 0 0-1.5-1.5h-2" />
  </Icon>
);

export const LinkIcon = (p: P) => (
  <Icon {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Icon>
);

export const Check = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
