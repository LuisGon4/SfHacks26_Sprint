import "server-only";
import { ApiError, GoogleGenAI, type GenerateContentConfig, type Part } from "@google/genai";
import { AppError, type ErrorCode } from "./errors";
import { posterResponseSchema, validatePosterResult, type PosterResult } from "./posterSchema";
import { SYSTEM_INSTRUCTION, USER_PROMPT } from "./prompt";

const getModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError("CONFIG_ERROR");
  return (client ??= new GoogleGenAI({ apiKey }));
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
  else if (status === 500 || status === 502 || status === 503) code = "UPSTREAM_BUSY";
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
