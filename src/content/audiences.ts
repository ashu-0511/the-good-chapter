import type { MediaKey } from "./media";

export const audiences: {
  id: string;
  name: string;
  line: string;
  cta: string;
  subject: string;
  media: MediaKey;
}[] = [
  {
    id: "colleges",
    name: "Colleges",
    line: "Make your campus memorable.",
    cta: "Start a campus chapter",
    subject: "Campus merch — let's talk",
    media: "campus",
  },
  {
    id: "startups",
    name: "Startups",
    line: "Build something people want to belong to.",
    cta: "Kit out the team",
    subject: "Startup team merch — let's talk",
    media: "startupTeam",
  },
  {
    id: "corporates",
    name: "Corporates",
    line: "Turn teams into tribes.",
    cta: "Plan corporate gifting",
    subject: "Corporate gifting — let's talk",
    media: "corporateRack",
  },
  {
    id: "events",
    name: "Events",
    line: "Give the moment something to remember.",
    cta: "Make event merch",
    subject: "Event merch — let's talk",
    media: "eventCrowd",
  },
];
