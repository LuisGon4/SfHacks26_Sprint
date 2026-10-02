"use client";

import { useEffect, useRef, useState } from "react";
import { analyze, analyzeDemo, type AnalyzeResult, type ApiResult } from "@/lib/client/api";
import { scrollToFocus } from "@/lib/client/focus";
import { DECODE_ERROR, prepareImage } from "@/lib/client/prepareImage";
import Hero from "./Hero";
import ResultView from "./ResultView";
import SiteHeader from "./SiteHeader";
import UploadZone from "./UploadZone";
import { BTN_OUTLINE, CALLOUT, CONTAINER } from "./ui";

type View =
  | { kind: "idle" }
  | { kind: "busy"; status: string }
  | { kind: "error"; message: string; offerDemo: boolean }
  | { kind: "result"; result: AnalyzeResult };

export default function PosterReader() {
  const [view, setView] = useState<View>({ kind: "idle" });
  const [image, setImage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Cancels any in-flight request; later results from it are ignored.
  const restart = () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setImage(null);
    return abortRef.current.signal;
  };

  const show = (signal: AbortSignal, res: ApiResult<AnalyzeResult>) => {
    if (signal.aborted) return;
    setView(res.ok ? { kind: "result", result: res.data } : { kind: "error", message: res.message, offerDemo: res.code === "RATE_LIMITED" });
  };

  const readFile = async (file: File) => {
    const signal = restart();
    setView({ kind: "busy", status: "Preparing your photo..." });
    try {
      const dataUrl = await prepareImage(file);
      if (signal.aborted) return;
      setImage(dataUrl);
      setView({ kind: "busy", status: "Reading the poster. This can take up to 30 seconds." });
      show(signal, await analyze(dataUrl, signal));
    } catch {
      // prepareImage only throws DECODE_ERROR; analyze only throws when aborted.
      if (!signal.aborted) setView({ kind: "error", message: DECODE_ERROR, offerDemo: false });
    }
  };

  const readDemo = async () => {
    const signal = restart();
    setView({ kind: "busy", status: "Loading the sample poster..." });
    try {
      show(signal, await analyzeDemo(signal));
    } catch {}
  };

  // "Read another poster" lands on the upload card; Home lands on the hero.
  const reset = (focusId = "upload-heading") => {
    restart();
    setView({ kind: "idle" });
    requestAnimationFrame(() => scrollToFocus(focusId));
  };

  const busy = view.kind === "busy";
  const body =
    view.kind === "result" ? (
      <div className={`${CONTAINER} py-10 sm:py-14`}>
        <ResultView result={view.result} image={image} onReset={() => reset()} />
      </div>
    ) : (
      <>
        <Hero />
        <div className={`${CONTAINER} py-16 sm:py-20`}>
          <div className="mx-auto flex max-w-3xl flex-col">
          {/* Always mounted so screen readers register it before content arrives. */}
          <div aria-live="polite" className="[&:not(:empty)]:mb-6">
            {view.kind === "busy" && (
              <p className="flex items-center gap-3 rounded-2xl bg-surface p-5 text-xl font-bold shadow-card">
                <span aria-hidden="true" className="size-6 shrink-0 animate-spin rounded-full border-4 border-line border-t-purple dark:border-t-gold" />
                {view.status}
              </p>
            )}
            {view.kind === "error" && <p className={`${CALLOUT} font-bold`}>{view.message}</p>}
          </div>
          {view.kind === "error" && view.offerDemo && (
            <button type="button" onClick={readDemo} className={`${BTN_OUTLINE} mb-6 self-start`}>
              View a sample result
            </button>
          )}
          <UploadZone disabled={busy} onFile={readFile} onDemo={readDemo} />
          </div>
        </div>
      </>
    );

  return (
    <>
      <SiteHeader onHome={reset} />
      <main className="flex-1">{body}</main>
    </>
  );
}
