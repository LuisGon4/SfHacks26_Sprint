"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { BTN_LINK, BTN_OUTLINE, BTN_PRIMARY, CARD } from "./ui";

type Props = { disabled: boolean; onFile: (file: File) => void; onDemo: () => void };

// Some pickers grey out HEIC under image/* alone.
const ACCEPT = "image/*,.heic,.heif";

// Outlined on touch devices, where "Take a photo" leads; filled on desktop, where it is the only action.
const PICK = `${BTN_OUTLINE} pointer-fine:border-transparent pointer-fine:bg-purple pointer-fine:text-white pointer-fine:hover:bg-purple-deep dark:pointer-fine:bg-gold dark:pointer-fine:text-purple-deep dark:pointer-fine:hover:bg-gold/90`;

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
    <section id="upload" aria-labelledby="upload-heading" className="flex scroll-mt-8 flex-col items-center gap-5 text-center">
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
        className={`${CARD} flex w-full flex-col items-center gap-6 sm:p-12 ${dragging ? "ring-4 ring-accent-line" : ""}`}
      >
        <div>
          <h2 id="upload-heading" tabIndex={-1} className="text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
            Hear what a poster says
          </h2>
          <p className="mx-auto mt-3 max-w-prose text-lg text-muted">
            Take a photo of an event flyer. You&apos;ll get the event name, date, time, and place in large text, and
            you can have it read aloud.
          </p>
        </div>
        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <button type="button" disabled={disabled} onClick={() => cameraRef.current?.click()} aria-describedby="privacy-note" className={`${BTN_PRIMARY} pointer-fine:hidden`}>
            Take a photo
          </button>
          <button type="button" disabled={disabled} onClick={() => pickerRef.current?.click()} aria-describedby="privacy-note" className={PICK}>
            Choose an image
          </button>
        </div>
        <p className="hidden text-muted pointer-fine:block">Or drop an image anywhere in this box.</p>
        <input ref={cameraRef} type="file" accept={ACCEPT} capture="environment" hidden onChange={pick} />
        <input ref={pickerRef} type="file" accept={ACCEPT} hidden onChange={pick} />
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
