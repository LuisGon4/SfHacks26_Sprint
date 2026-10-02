import "server-only";
import { ApiError, GoogleGenAI, type GenerateContentConfig, type Part } from "@google/genai";
import { AppError, type ErrorCode } from "./errors";
import { askResponseSchema, validateAnswer } from "./askSchema";
import { posterResponseSchema, validatePosterResult, type PosterResult } from "./posterSchema";
import { ASK_INSTRUCTION, QUESTION_LABEL, SYSTEM_INSTRUCTION, USER_PROMPT } from "./prompt";

const getModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const BUSY_STATUSES = [500, 502, 503];
// One retry after ~1 s, only for transient overload (UPSTREAM_BUSY). Not 429: retrying burns quota.
// The SDK stops retrying once the caller's abort signal fires.
const RETRY = { attempts: 2, initialDelay: 1, maxDelay: 2, httpStatusCodes: BUSY_STATUSES };

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError("CONFIG_ERROR");
  return (client ??= new GoogleGenAI({ apiKey, httpOptions: { retryOptions: RETRY } }));
}

// A client disconnect (req.signal) also maps to UPSTREAM_TIMEOUT; the response is simply unused.
export function toAppError(e: unknown, signal?: AbortSignal): AppError {
  if (e instanceof AppError) return e;
  const name = e instanceof Error ? e.name : "";
  const status = e instanceof ApiError ? e.status : undefined;
  let code: ErrorCode = "UPSTREAM_ERROR";
  if (signal?.aborted || name === "AbortError" || name === "TimeoutError") code = "UPSTREAM_TIMEOUT";
  else if (status === 429) code = "RATE_LIMITED";
  // Google reports a bad key as 400 API_KEY_INVALID; the reason is checked, never surfaced.
  // 404 means a bad model id.
  else if (status === 401 || status === 403 || status === 404 || (e instanceof ApiError && e.status === 400 && e.message.includes("API_KEY_INVALID"))) code = "CONFIG_ERROR";
  else if (status === 408 || status === 504) code = "UPSTREAM_TIMEOUT";
  else if (status !== undefined && BUSY_STATUSES.includes(status)) code = "UPSTREAM_BUSY";
  console.error("gemini", code, status);
  return new AppError(code);
}

export async function generateJson(parts: Part[], config: GenerateContentConfig, signal?: AbortSignal): Promise<unknown> {
  let text: string | undefined;
  try {
    const res = await getClient().models.generateContent({
      model: getModel(),
      contents: [{ role: "user", parts }],
      config: { ...config, responseMimeType: "application/json", temperature: 0, abortSignal: signal },
    });
    text = res.text;
    if (!text) console.error("gemini", "INVALID_AI_RESPONSE", res.promptFeedback?.blockReason ?? res.candidates?.[0]?.finishReason);
  } catch (e) {
    throw toAppError(e, signal);
  }
  if (!text) throw new AppError("INVALID_AI_RESPONSE");
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("INVALID_AI_RESPONSE");
  }
}

export async function analyzePoster(base64: string, mimeType: string, signal?: AbortSignal): Promise<PosterResult> {
  const raw = await generateJson(
    [{ inlineData: { mimeType, data: base64 } }, { text: USER_PROMPT }],
    { systemInstruction: SYSTEM_INSTRUCTION, responseSchema: posterResponseSchema },
    signal,
  );
  const result = validatePosterResult(raw);
  if (!result) throw new AppError("INVALID_AI_RESPONSE");
  return result;
}

export async function askPoster(base64: string, mimeType: string, question: string, signal?: AbortSignal): Promise<string> {
  const raw = await generateJson(
    [{ inlineData: { mimeType, data: base64 } }, { text: QUESTION_LABEL + JSON.stringify(question) }],
    { systemInstruction: ASK_INSTRUCTION, responseSchema: askResponseSchema },
    signal,
  );
  const answer = validateAnswer(raw);
  if (!answer) throw new AppError("INVALID_AI_RESPONSE");
  return answer;
}
