"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ask } from "@/lib/client/api";
import { MAX_QUESTION_LEN } from "@/lib/constants";
import { BTN_CHIP, BTN_PRIMARY, CALLOUT, CARD, INPUT } from "./ui";

const SUGGESTIONS = ["Is it free?", "Is there food?", "Do I need to register?"];

export default function AskBox({ image }: { image: string }) {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState({ text: "", error: false });
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setQuestion(trimmed);
    setBusy(true);
    setReply({ text: "Looking for the answer...", error: false });
    try {
      const res = await ask(image, trimmed, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setReply(res.ok ? { text: res.data.answer, error: false } : { text: res.message, error: true });
    } catch {
      return; // aborted: the component is gone
    } finally {
      if (!ctrl.signal.aborted) setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(question);
  };

  return (
    <section aria-labelledby="ask-heading" className={`${CARD} flex flex-col gap-4`}>
      <h3 id="ask-heading" className="text-2xl font-extrabold">
        Ask about this poster
      </h3>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => submit(s)}
            className={BTN_CHIP}
          >
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="question" className="font-bold">
          Your question
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={MAX_QUESTION_LEN}
            aria-describedby="question-count"
            className={`${INPUT} flex-1`}
          />
          <button
            type="submit"
            disabled={busy || !question.trim()}
            className={BTN_PRIMARY}
          >
            {busy ? "Asking..." : "Ask"}
          </button>
        </div>
        <p id="question-count" className="text-sm text-muted">
          {question.length} of {MAX_QUESTION_LEN} characters
        </p>
      </form>
      <p aria-live="polite" className={reply.error ? `${CALLOUT} font-bold` : "min-h-[1.6em] text-xl"}>
        {reply.text}
      </p>
    </section>
  );
}
