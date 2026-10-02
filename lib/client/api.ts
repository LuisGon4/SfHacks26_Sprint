import { CODE_MESSAGE, type ErrorCode } from "@/lib/errors";
import type { PosterResult } from "@/lib/posterSchema";

export type AnalyzeResult = PosterResult & { demo: boolean };
export type ClientErrorCode = ErrorCode | "NETWORK";
export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: ClientErrorCode; message: string };

const CLIENT_TIMEOUT_MS = 35_000;
const RETRY_DELAY_MS = 1_000;
const RETRYABLE = new Set<ClientErrorCode>(["UPSTREAM_ERROR", "UPSTREAM_TIMEOUT", "UPSTREAM_BUSY", "INVALID_AI_RESPONSE"]);
const NETWORK_MESSAGE = "Couldn't reach Summareyes. Check your connection and try again.";

const fail = (code: ClientErrorCode): ApiResult<never> => ({
  ok: false,
  code,
  message: code === "NETWORK" ? NETWORK_MESSAGE : CODE_MESSAGE[code],
});

type Attempt<T> = ApiResult<T> & { clientTimeout?: boolean };

// Throws AbortError if the caller's signal aborts, so callers can ignore stale requests.
async function postOnce<T>(url: string, body: unknown, signal?: AbortSignal): Promise<Attempt<T>> {
  let res: Response;
  try {
    const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    return e instanceof DOMException && e.name === "TimeoutError" ? { ...fail("UPSTREAM_TIMEOUT"), clientTimeout: true } : fail("NETWORK");
  }
  const json = await res.json().catch(() => null);
  if (res.ok && json) return { ok: true, data: json as T };
  const code = json?.error?.code;
  // Branch on code only; messages always come from our own table.
  if (typeof code === "string" && Object.hasOwn(CODE_MESSAGE, code)) return fail(code as ErrorCode);
  if (res.status === 413) return fail("TOO_LARGE");
  return fail(res.status >= 500 ? "UPSTREAM_ERROR" : "NETWORK"); // e.g. a platform HTML error page
}

// Retries once on transient upstream failures (not after our own 35s timeout), per API.md.
async function postJson<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<ApiResult<T>> {
  const first = await postOnce<T>(url, body, signal);
  if (first.ok || first.clientTimeout || !RETRYABLE.has(first.code)) return first;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  signal?.throwIfAborted();
  return postOnce<T>(url, body, signal);
}

export const analyze = (image: string, signal?: AbortSignal) => postJson<AnalyzeResult>("/api/analyze", { image }, signal);
export const analyzeDemo = (signal?: AbortSignal) => postJson<AnalyzeResult>("/api/analyze?demo=1", undefined, signal);
export const ask = (image: string, question: string, signal?: AbortSignal) =>
  postJson<{ answer: string }>("/api/ask", { image, question }, signal);
