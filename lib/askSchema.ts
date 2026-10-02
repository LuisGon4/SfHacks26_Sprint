import { Type, type Schema } from "@google/genai";
import { AppError } from "./errors";
import { MAX_QUESTION_LEN } from "./constants";
import { cleanText } from "./posterSchema";

export const NOT_STATED = "The poster doesn't say.";
export const MAX_ANSWER_LEN = 500;

export const askResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING, description: `Answer in 1-3 short sentences, under ${MAX_ANSWER_LEN} characters. Use "${NOT_STATED}" if the image does not say.` },
  },
  required: ["answer"],
};

export function parseQuestion(v: unknown): string {
  const q = typeof v === "string" ? cleanText(v, Infinity) : "";
  if (!q || Array.from(q).length > MAX_QUESTION_LEN) throw new AppError("BAD_REQUEST");
  return q;
}

export function validateAnswer(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const a = (raw as Record<string, unknown>).answer;
  return typeof a === "string" ? cleanText(a, MAX_ANSWER_LEN) || null : null;
}
