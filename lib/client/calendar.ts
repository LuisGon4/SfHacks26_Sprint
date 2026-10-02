import * as chrono from "chrono-node";
import { NOT_FOUND } from "@/lib/constants";
import type { PosterResult } from "@/lib/posterSchema";

// Form values: day "YYYY-MM-DD"; start/end "HH:MM", or "" for an all-day event.
export type When = { day: string; start: string; end: string };

// Date inputs accept 5-digit years; anything else would build a broken link.
export const validDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && !isNaN(Date.parse(day));

const TIME_ZONE = "America/Los_Angeles";
const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const plusHour = (d: Date) => new Date(d.getTime() + 3_600_000);

// What the parser couldn't be sure of, for the hint.
export type Guess = When & { checkAmPm: boolean; multiDay: boolean };

// Best guess from the poster's printed date and time, for the user to confirm.
// Fields stay "" when unclear. day is "" when the date is missing, impossible ("Sep 31"),
// or its printed weekday disagrees with it, so the user enters it instead.
export function parseWhen(date: string, time: string, now = new Date()): Guess {
  // Parsed apart so a time like "12-3PM" is never read as part of the date (year 2012).
  const r = date === NOT_FOUND ? undefined : chrono.parse(date, now, { forwardDate: true })[0];
  const d = r?.start;
  const clear = d?.isCertain("day") || d?.isCertain("weekday");
  const mismatch = d?.isCertain("day") && d.isCertain("weekday") && d.get("weekday") !== d.date().getDay();
  const day = clear && !mismatch ? toDay(d!.date()) : "";
  const multiDay = !!r?.end?.isCertain("day") && toDay(r.end.date()) !== toDay(r.start.date());

  const t = time === NOT_FOUND ? undefined : chrono.parse(time, now)[0];
  if (!t?.start.isCertain("hour")) return { day, start: "", end: "", checkAmPm: false, multiDay };
  const s = t.start;
  const e = t.end?.isCertain("hour") ? t.end : undefined;
  let start = s.date();
  let end = e ? e.date() : plusHour(start);
  // chrono spreads one printed am/pm over the range (and pushes the end to the next day);
  // undo it when the end's time of day lands before the start's.
  if (e && toTime(end) <= toTime(start)) {
    if (!s.isCertain("meridiem") && s.get("hour")! >= 12) start = new Date(start.getTime() - 12 * 3_600_000); // "11-2pm"
    else if (!e.isCertain("meridiem") && e.get("hour")! < 12) end = new Date(end.getTime() + 12 * 3_600_000); // "9:00 - 5:00"
  }
  const checkAmPm = !s.isCertain("meridiem") && !e?.isCertain("meridiem");
  return { day, start: toTime(start), end: toTime(end), checkAmPm, multiDay };
}

// Google Calendar's prefilled "new event" page; nothing is saved until the user does it there.
export function googleCalendarUrl(r: PosterResult, w: When): string {
  const found = (v: string) => (v === NOT_FOUND ? "" : v);
  const stamp = (d: Date) => toDay(d).replaceAll("-", "") + (w.start ? `T${toTime(d).replace(":", "")}00` : "");

  const start = new Date(`${w.day}T${w.start || "00:00"}`);
  const end = !w.start
    ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) // all-day: end is exclusive
    : w.end
      ? new Date(`${w.day}T${w.end}`)
      : plusHour(start);
  if (end.getTime() === start.getTime()) end.setHours(end.getHours() + 1);
  else if (end < start) end.setDate(end.getDate() + 1); // ends after midnight, e.g. "10pm - 1am"

  const details = [found(r.description), found(r.contact_or_link), "From Summareyes. Verify with the event organizer."]
    .filter(Boolean)
    .join("\n\n");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: found(r.event_name) || "Event",
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: TIME_ZONE,
    details,
  });
  if (found(r.location)) q.set("location", r.location);
  return `https://calendar.google.com/calendar/render?${q}`;
}
