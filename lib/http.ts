import { AppError, CODE_MESSAGE, CODE_STATUS } from "./errors";

export const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export function errorResponse(e: unknown): Response {
  const code = e instanceof AppError ? e.code : "UPSTREAM_ERROR";
  console.error("api", code);
  return json({ error: { code, message: CODE_MESSAGE[code] } }, CODE_STATUS[code]);
}

// Same-origin only: a missing or "null" Origin is rejected.
export function checkOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  let host: string | undefined;
  try {
    if (origin && origin !== "null") host = new URL(origin).host;
  } catch {}
  if (!host || host !== req.headers.get("host")) throw new AppError("FORBIDDEN_ORIGIN");
}

export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  if (!req.headers.get("content-type")?.startsWith("application/json")) throw new AppError("BAD_REQUEST");
  if (Number(req.headers.get("content-length")) > maxBytes) throw new AppError("TOO_LARGE");
  const buf = await req.arrayBuffer();
  if (buf.byteLength > maxBytes) throw new AppError("TOO_LARGE");
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    throw new AppError("BAD_REQUEST");
  }
}
