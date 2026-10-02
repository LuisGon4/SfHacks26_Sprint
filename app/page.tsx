import PosterReader from "./components/PosterReader";

export default function Home() {
  return (
    <>
      <header className="on-dark border-b-8 border-gold bg-purple text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-3 px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-extrabold whitespace-nowrap">
            {/* Spelled out so screen readers say "summar eyes" instead of guessing. */}
            <span aria-hidden="true">Summareyes</span>
            <span className="sr-only">Summar-eyes</span>
          </h1>
          <p className="text-white/85">for SF State students</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <PosterReader />
      </main>
      <footer className="border-t-2 border-line">
        <p className="mx-auto max-w-6xl px-4 py-6 text-muted sm:px-6">
          Made at SFHacks 2026. This app doesn&apos;t save your photos or results.
        </p>
      </footer>
    </>
  );
}
