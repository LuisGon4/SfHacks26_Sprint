import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import { BAND, BAND_TITLE, BTN_PRIMARY, CARD, CONTAINER, OVERLAP } from "../components/ui";

export const metadata: Metadata = {
  title: "About · Summareyes",
  description: "Why we built Summareyes: so blind and low-vision students can find SF State events too.",
};

const SECTIONS = [
  {
    heading: "The problem",
    body: "Most campus events are advertised on printed flyers and image-only social posts. Screen readers can't read them. For blind and low-vision students, that means missing the club meeting, the free lunch, or the career fair that everyone else walked past.",
  },
  {
    heading: "What Summareyes does",
    body: "Take a photo of any event poster. Summareyes reads it and gives you the event name, date, time, and place in large, clear text. It also writes a short summary you can hear out loud. You can ask follow-up questions like \"Is there free food?\" and get an answer based only on what the poster says.",
  },
  {
    heading: "How we built it",
    body: "We made accessibility the starting point, not an add-on. The app uses a font designed for low vision, high-contrast SFSU colors, and large tap targets. Every screen is built for screen readers, and every message is written to be spoken. If something on a poster is unclear, Summareyes says so instead of guessing.",
  },
  {
    heading: "Your privacy",
    body: "Summareyes doesn't save your photos, questions, or results. It never tries to identify people in a photo.",
  },
];

export default function About() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className={BAND}>
          <div className={`${CONTAINER} flex flex-col items-center gap-6`}>
            <p className="text-lg font-bold text-gold">About Summareyes</p>
            <h2 className={BAND_TITLE}>
              Every SF State event, open to <span className="text-gold">every</span> student.
            </h2>
            <p className="max-w-2xl text-xl text-white/85">
              Our goal is simple: blind and low-vision students should be able to find out what&apos;s happening on
              campus as easily as anyone else.
            </p>
          </div>
        </div>
        <div className={`${CONTAINER} ${OVERLAP} flex flex-col items-center gap-12 pb-16`}>
          <div className="grid w-full gap-6 md:grid-cols-2">
            {SECTIONS.map(({ heading, body }) => (
              <section key={heading} className={CARD}>
                <h3 className="text-2xl font-extrabold">{heading}</h3>
                <p className="mt-3 text-lg text-muted">{body}</p>
              </section>
            ))}
          </div>
          <Link href="/#upload" className={BTN_PRIMARY}>
            Read a poster
          </Link>
        </div>
      </main>
    </>
  );
}
