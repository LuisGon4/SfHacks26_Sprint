"use client";

import { useEffect, useRef } from "react";
import type { AnalyzeResult } from "@/lib/client/api";
import { NOT_FOUND } from "@/lib/constants";
import AskBox from "./AskBox";
import ReadAloudButton from "./ReadAloudButton";
import { BTN_PRIMARY, CALLOUT, CARD } from "./ui";

type Props = { result: AnalyzeResult; image: string | null; onReset: () => void };
type Key = keyof AnalyzeResult;

// [label, field, always shown even when "Not found"]
const ROWS: [string, Key, boolean][] = [
  ["Date", "date", true],
  ["Time", "time", true],
  ["Where", "location", true],
  ["How to register", "registration", false],
  ["Hosted by", "host_organization", false],
  ["Contact", "contact_or_link", false],
  ["About", "description", false],
];

const found = (v: unknown) => v !== NOT_FOUND;

export default function ResultView({ result: r, image, onReset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [r]);

  const heading = !r.is_poster ? r.summary : found(r.event_name) ? r.event_name : "Event name not readable";
  const speech = [r.demo && "Sample result.", r.summary, found(r.confidence_notes) && `Note: ${r.confidence_notes}`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={image ? "grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12" : "max-w-3xl"}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL, nothing to optimize
        <img src={image} alt="Your poster photo" className="max-h-80 w-auto self-start rounded-3xl object-contain shadow-card lg:sticky lg:top-6 lg:max-h-[80vh]" />
      )}

      <div className="flex min-w-0 flex-col gap-8">
        <section className="on-dark reveal flex flex-col gap-5 rounded-3xl bg-band p-6 text-white shadow-card sm:p-10">
          {r.demo && <p className="self-start rounded-full bg-gold px-4 py-1 font-bold text-purple-deep">Sample result</p>}
          <h2 ref={headingRef} tabIndex={-1} className="text-4xl leading-[1.05] font-extrabold text-balance break-words lg:text-5xl">
            {heading}
          </h2>
          {r.is_poster && <p className="max-w-prose text-xl">{r.summary}</p>}
          <ReadAloudButton key={speech} text={speech} />
        </section>

        {r.is_poster && found(r.confidence_notes) && (
          <div role="note" className={CALLOUT}>
            <strong>Check this: </strong>
            {r.confidence_notes}
          </div>
        )}

        {r.is_poster && (
          <dl className={`${CARD} divide-y divide-line py-2 sm:py-2`}>
            {ROWS.filter(([, k, always]) => always || found(r[k])).map(([label, k]) => (
              <div key={k} className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                <dt className="font-bold text-muted">{label}</dt>
                <dd className={`text-xl break-words ${found(r[k]) ? "" : "text-muted italic"}`}>{r[k]}</dd>
              </div>
            ))}
          </dl>
        )}

        {found(r.visual_description) && (
          <details open={!r.is_poster} className={`${CARD} text-lg`}>
            <summary className="min-h-12 cursor-pointer content-center font-bold">What the image looks like</summary>
            <p className="mt-2 max-w-prose">{r.visual_description}</p>
          </details>
        )}

        {r.is_poster && (
          <p className="text-muted">AI can make mistakes. Verify the date, time, and location with the event organizer.</p>
        )}

        {r.is_poster && !r.demo && image && <AskBox image={image} />}

        <button type="button" onClick={onReset} className={`${BTN_PRIMARY} self-start`}>
          Scan another poster
        </button>
      </div>
    </div>
  );
}
