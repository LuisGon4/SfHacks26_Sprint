"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { BTN_OUTLINE, CONTAINER } from "./ui";

const NAV = "inline-flex min-h-12 items-center text-lg font-bold text-muted hover:text-fg aria-[current=page]:text-fg";

// onHome lets the home page reset in place (focusing the given heading), since "/" to "/" is not a navigation.
export default function SiteHeader({ onHome }: { onHome?: (focusId: string) => void }) {
  const pathname = usePathname();
  const toHome =
    (focusId: string): LinkProps["onNavigate"] =>
    (e) => {
      if (pathname !== "/" || !onHome) return;
      e.preventDefault();
      onHome(focusId);
    };

  return (
    <header className="bg-ground">
      <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:gap-x-6`}>
        <h1 className="text-xl font-extrabold whitespace-nowrap sm:text-2xl">
          <Link href="/" onNavigate={toHome("hero-heading")} className="inline-flex min-h-12 items-center">
            {/* Spelled out so screen readers say "summar eyes" instead of guessing. */}
            <span aria-hidden="true">Summareyes</span>
            <span className="sr-only">Summar-eyes</span>
          </Link>
        </h1>
        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
            <li>
              <Link href="/" onNavigate={toHome("hero-heading")} aria-current={pathname === "/" ? "page" : undefined} className={NAV}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined} className={NAV}>
                About
              </Link>
            </li>
            {/* Hidden on phones to keep the header on one row; Home leads to the upload area. */}
            <li className="hidden sm:block">
              <Link href="/#upload" onNavigate={toHome("upload-heading")} className={`${BTN_OUTLINE} px-6`}>
                Read a poster
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
