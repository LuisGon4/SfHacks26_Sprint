import Link from "next/link";
import { scrollToFocus } from "@/lib/client/focus";
import { BAND, BAND_TITLE, BTN_GOLD, CARD, CONTAINER, OVERLAP } from "./ui";

// 24px stroke icons, decorative only.
const ICONS = {
  read: "M4 6h16M4 12h16M4 18h10",
  hear: "M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
  ask: "M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z",
};

const POINTS = [
  ["read", "Read it", "The event name, date, time, and place in large, clear text."],
  ["hear", "Hear it", "A short summary of the poster, read out loud."],
  ["ask", "Ask it", "Questions like \"Is there free food?\" answered from the poster."],
] as const;

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading">
      <div className={BAND}>
        <div className={`${CONTAINER} flex flex-col items-center gap-6`}>
          <p className="text-lg font-bold text-gold">For SF State students</p>
          <h2 id="hero-heading" tabIndex={-1} className={BAND_TITLE}>
            Built with <span className="text-gold">everyone</span> in mind.
          </h2>
          <p className="max-w-2xl text-xl text-white/85">
            Campus events live on flyers that screen readers can&apos;t see. Summareyes turns any poster into words you
            can read, hear, and ask about, so blind and low-vision students never miss out.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
            <button type="button" onClick={() => scrollToFocus("upload-heading")} className={BTN_GOLD}>
              Read a poster <span aria-hidden="true">↓</span>
            </button>
            <Link href="/about" className="inline-flex min-h-12 items-center gap-2 text-lg font-bold hover:underline underline-offset-4">
              Why we built it <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cards ride up over the bottom of the band. */}
      <ul className={`${CONTAINER} ${OVERLAP} grid gap-6 md:grid-cols-3`}>
        {POINTS.map(([icon, title, text]) => (
          <li key={title} className={`${CARD} flex flex-col gap-3`}>
            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-purple text-white dark:bg-gold dark:text-purple-deep">
              <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
                <path d={ICONS[icon]} />
              </svg>
            </span>
            <h3 className="text-2xl font-extrabold">{title}</h3>
            <p className="text-lg text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
