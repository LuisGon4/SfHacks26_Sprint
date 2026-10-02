"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { BTN_LINK, BTN_OUTLINE, BTN_PRIMARY } from "./ui";

type Props = { disabled: boolean; onFile: (file: File) => void; onDemo: () => void };

export default function UploadZone({ disabled, onFile, onDemo }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (file?: File) => {
    if (file && !disabled) onFile(file);
  };
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    take(e.target.files?.[0]);
    e.target.value = ""; // allow picking the same file again
  };

  return (
    <section aria-labelledby="upload-heading" className="flex max-w-2xl flex-col gap-5">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col gap-6 rounded-3xl border-3 border-dashed border-accent-line p-6 sm:p-10 ${dragging ? "bg-surface" : ""}`}
      >
        <div>
          <h2 id="upload-heading" tabIndex={-1} className="text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
            Hear what a poster says
          </h2>
          <p className="mt-3 max-w-prose text-lg text-muted">
            Take a photo of an event flyer. You&apos;ll get the event name, date, time, and place in large text, and
            you can have it read aloud.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={disabled} onClick={() => cameraRef.current?.click()} aria-describedby="privacy-note" className={`${BTN_PRIMARY} pointer-fine:hidden`}>
            Take a photo
          </button>
          <button type="button" disabled={disabled} onClick={() => pickerRef.current?.click()} aria-describedby="privacy-note" className={BTN_OUTLINE}>
            Choose an image
          </button>
        </div>
        <p className="hidden text-muted pointer-fine:block">Or drop an image anywhere in this box.</p>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
        <input ref={pickerRef} type="file" accept="image/*" hidden onChange={pick} />
      </div>

      <p id="privacy-note" className="max-w-prose text-muted">
        Images are sent to Google&apos;s AI for analysis. Don&apos;t upload images with sensitive personal information.
      </p>
      <p>
        <button type="button" disabled={disabled} onClick={onDemo} className={BTN_LINK}>
          Try a sample poster
        </button>
      </p>
    </section>
  );
}
