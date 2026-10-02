"use client";

import { useState } from "react";
import type { AnalyzeResult } from "@/lib/client/api";
import { googleCalendarUrl, parseWhen, validDay, type When } from "@/lib/client/calendar";
import { BTN_PRIMARY, CARD, INPUT } from "./ui";

const FIELDS: [label: string, key: keyof When, type: "date" | "time"][] = [
  ["Date", "day", "date"],
  ["Starts", "start", "time"],
  ["Ends", "end", "time"],
];

// Prefills from the poster text; the user confirms or fixes it before anything leaves the app.
export default function CalendarCard({ result }: { result: AnalyzeResult }) {
  const [guess] = useState(() => parseWhen(result.date, result.time));
  const [when, setWhen] = useState<When>({ day: guess.day, start: guess.start, end: guess.end });
  const ready = validDay(when.day);

  const hint = [
    guess.day ? "Check the date and time before saving." : "We couldn't read a clear date. Enter it to add this event.",
    guess.multiDay && "This event runs over several days; only the first day is filled in.",
    guess.checkAmPm && "The poster doesn't say AM or PM, so check the times.",
    "Leave the times empty for an all-day event.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section aria-labelledby="cal-heading" className={`${CARD} flex flex-col gap-4`}>
      <h3 id="cal-heading" className="text-2xl font-extrabold">
        Add to your calendar
      </h3>
      <p id="cal-hint" className="text-lg">
        {hint}
      </p>
      <div className="flex flex-wrap gap-4">
        {FIELDS.map(([label, key, type]) => (
          <label key={key} className="flex flex-col gap-1 font-bold">
            {label}
            <input
              type={type}
              value={when[key]}
              onChange={(e) => setWhen({ ...when, [key]: e.target.value })}
              aria-describedby={key === "day" ? "cal-hint" : undefined}
              className={`${INPUT} font-normal`}
            />
          </label>
        ))}
      </div>
      {ready ? (
        <a href={googleCalendarUrl(result, when)} target="_blank" rel="noopener noreferrer" className={`${BTN_PRIMARY} self-start`}>
          Add to Google Calendar<span className="sr-only"> (opens Google Calendar)</span>
        </a>
      ) : (
        // Focusable (unlike disabled) so screen readers reach it and hear why it's unavailable.
        <button type="button" aria-disabled="true" aria-describedby="cal-hint" className={`${BTN_PRIMARY} self-start opacity-50`}>
          Add to Google Calendar
        </button>
      )}
    </section>
  );
}
