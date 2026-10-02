import { parseQuestion } from "@/lib/askSchema";
import { askPoster } from "@/lib/gemini";
import { MAX_BODY_BYTES, TIMEOUT_MS, checkOrigin, errorResponse, json, readJson } from "@/lib/http";
import { parseImageDataUrl } from "@/lib/image";

export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    checkOrigin(req);
    const body = (await readJson(req, MAX_BODY_BYTES)) as { image?: unknown; question?: unknown } | null;
    const question = parseQuestion(body?.question);
    const { mimeType, base64 } = parseImageDataUrl(body?.image);
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]);
    return json({ answer: await askPoster(base64, mimeType, question, signal) });
  } catch (e) {
    return errorResponse(e);
  }
}
