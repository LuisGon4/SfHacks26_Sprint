import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { CONTAINER } from "./components/ui";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false, // Next has no metrics for this font
});

export const metadata: Metadata = {
  title: "Summareyes",
  description: "Snap an SFSU event poster and hear what it says.",
};

export const viewport: Viewport = {
  themeColor: "#463077",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <footer>
          <p className={`${CONTAINER} py-10 text-center text-muted`}>
            Made at SFHacks 2026. This app doesn&apos;t save your photos or results.
          </p>
        </footer>
      </body>
    </html>
  );
}
