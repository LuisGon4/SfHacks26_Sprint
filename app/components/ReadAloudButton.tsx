"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BTN_GOLD } from "./ui";

const noopSubscribe = () => () => {};
const isSupported = () => "speechSynthesis" in window;

export default function ReadAloudButton({ text }: { text: string }) {
  const supported = useSyncExternalStore(noopSubscribe, isSupported, () => false);
  const [speaking, setSpeaking] = useState(false);
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speaking when the result changes or goes away.
  useEffect(() => () => window.speechSynthesis?.cancel(), [text]);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    current.current = null;
    if (speaking) return setSpeaking(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    // Ignore late end/error events from a cancelled utterance.
    u.onend = u.onerror = () => current.current === u && setSpeaking(false);
    current.current = u;
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={speaking} className={BTN_GOLD}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-current">
        {speaking ? (
          <rect x="6" y="6" width="12" height="12" rx="2" />
        ) : (
          <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
        )}
      </svg>
      {speaking ? "Stop reading" : "Read aloud"}
    </button>
  );
}
