"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { speak } from "@/lib/client/api";
import { BTN_GOLD } from "./ui";

// Empty WAV played inside the tap, so iOS still allows play() after the fetch resolves.
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const FALLBACK_NOTE = "The AI voice isn't available right now, so your device's voice is reading instead.";
const LABEL = { idle: "Read aloud", loading: "Loading voice...", playing: "Stop reading" };
const CHUNK_LEN = 300; // under the server's MAX_SPEECH_LEN
const FIRST_CHUNK_LEN = 150; // a short first chunk gets audio playing in ~4 s
// Up to CHUNK_LEN chars ending at a space, or a hard cut for one giant word.
const PIECE = new RegExp(`\\S.{0,${CHUNK_LEN - 1}}(?=\\s|$)|\\S{${CHUNK_LEN}}`, "g");

type Status = keyof typeof LABEL;

class SpeechError extends Error {}

// Packs whole sentences into chunks of at most CHUNK_LEN characters (the first one shorter when possible).
function chunk(text: string): string[] {
  const out: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const piece of sentence.match(PIECE) ?? []) {
      const last = out.at(-1);
      const max = out.length === 1 ? FIRST_CHUNK_LEN : CHUNK_LEN;
      if (last && last.length + 1 + piece.length <= max) out[out.length - 1] = `${last} ${piece}`;
      else out.push(piece);
    }
  }
  return out;
}

// Resolves when the clip ends; rejects on a media error or an interrupted play().
// onInterrupt fires on an outside pause (OS interruption, headphones unplugged), armed only once playing.
const playClip = (el: HTMLAudioElement, url: string, onInterrupt: () => void) =>
  new Promise<void>((resolve, reject) => {
    el.onpause = null;
    el.src = url;
    el.onended = () => resolve();
    el.onerror = () => reject(new Error("audio"));
    el.play().then(() => (el.onpause = () => !el.ended && onInterrupt()), reject);
  });

export default function ReadAloudButton({ text }: { text: string }) {
  const chunks = useMemo(() => chunk(text), [text]);
  const [status, setStatus] = useState<Status>("idle");
  const [note, setNote] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const urls = useRef<string[]>([]); // cached AI clips, one per chunk
  const abort = useRef<AbortController | null>(null);
  const run = useRef(0); // bumped on every start/stop; stale runs bail out
  const useDevice = useRef(false);

  // Unmount (the parent keys this component by text): stop everything, free clips.
  useEffect(
    () => () => {
      run.current++;
      abort.current?.abort();
      audio.current?.pause();
      window.speechSynthesis?.cancel();
      urls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );

  const stop = () => {
    run.current++;
    abort.current?.abort();
    audio.current?.pause();
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setNote("");
  };

  const speakWithDevice = (from: number) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(chunks.slice(from).join(" "));
    u.lang = "en-US";
    // Ignore late events from a cancelled utterance.
    u.onend = u.onerror = () => !synth.speaking && !synth.pending && setStatus("idle");
    synth.speak(u);
    setStatus("playing");
  };

  const fallback = (message: string, from: number) => {
    useDevice.current = true;
    if (!("speechSynthesis" in window)) {
      setStatus("idle");
      return setNote(message);
    }
    setNote(FALLBACK_NOTE);
    speakWithDevice(from);
  };

  const fetchClip = async (i: number, signal: AbortSignal) => {
    if (urls.current[i]) return urls.current[i];
    const res = await speak(chunks[i], signal);
    if (!res.ok) throw new SpeechError(res.message);
    return (urls.current[i] = URL.createObjectURL(res.data));
  };

  const play = async () => {
    if (status !== "idle") return stop();
    const id = ++run.current;
    setNote("");
    if (useDevice.current) return speakWithDevice(0);

    const el = (audio.current ??= new Audio());
    el.onpause = null;
    el.src = SILENT_WAV;
    el.play().catch(() => {});
    const ctrl = (abort.current = new AbortController());

    let i = 0;
    try {
      let next = fetchClip(0, ctrl.signal);
      for (; i < chunks.length; i++) {
        if (!urls.current[i]) {
          setStatus("loading");
          setNote("Loading voice...");
        }
        const url = await next;
        if (run.current !== id) return;
        if (i + 1 < chunks.length) {
          next = fetchClip(i + 1, ctrl.signal); // prefetch while this chunk plays
          next.catch(() => {}); // handled when awaited
        }
        setStatus("playing");
        setNote("");
        await playClip(el, url, () => run.current === id && stop());
        if (run.current !== id) return;
      }
      setStatus("idle");
    } catch (e) {
      if (run.current !== id) return; // stopped or unmounted: not a failure
      fallback(e instanceof SpeechError ? e.message : "Couldn't play the audio.", i);
    }
  };

  return (
    <div className="flex flex-col">
      <button type="button" onClick={play} className={BTN_GOLD}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-6 fill-current ${status === "loading" ? "animate-pulse" : ""}`}>
          {status === "idle" ? (
            <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
          ) : (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          )}
        </svg>
        {LABEL[status]}
      </button>
      {/* Always mounted so screen readers register it before the note appears. */}
      <p aria-live="polite" className="text-white/90 [&:not(:empty)]:mt-3">
        {note}
      </p>
    </div>
  );
}
